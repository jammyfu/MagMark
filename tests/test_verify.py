"""Unit-test the real governance entrypoint; do not run or simulate project npm tests."""
from contextlib import redirect_stdout
from importlib.util import module_from_spec, spec_from_file_location
from io import StringIO
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import TestCase, main
from unittest.mock import patch

SPEC = spec_from_file_location("magmark_verify", Path(__file__).resolve().parents[1] / "tools" / "verify.py")
assert SPEC is not None and SPEC.loader is not None
verify = module_from_spec(SPEC)
SPEC.loader.exec_module(verify)


class VerificationGateTests(TestCase):
    def setUp(self):
        self.temp = TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for name in verify.REQUIRED_FILES:
            target = self.root / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text("fixture\n", encoding="utf-8")

    def invoke(self, *args, outcomes=None):
        output = StringIO()
        with patch.object(verify, "ROOT", self.root), patch.object(verify, "VERIFY_MODE", "node"), \
                patch.object(verify, "RUN_CHECKS_BY_DEFAULT", False), \
                patch("sys.argv", ["verify.py", *args]), \
                patch.object(verify, "run", side_effect=outcomes) as run, redirect_stdout(output):
            status = verify.main()
        return status, output.getvalue(), run

    def prepare_dependencies(self):
        (self.root / "package.json").write_text("{}", encoding="utf-8")
        (self.root / "node_modules").mkdir()

    def test_governance_only_identifies_its_scope(self):
        status, output, run = self.invoke()
        self.assertEqual(status, 0)
        self.assertIn("Governance-only verification passed", output)
        self.assertNotIn("Deep verification passed", output)
        run.assert_not_called()

    def test_deep_without_package_is_failure(self):
        status, output, run = self.invoke("--deep")
        self.assertNotEqual(status, 0)
        self.assertIn("incomplete", output.lower())
        run.assert_not_called()

    def test_deep_without_dependencies_is_failure(self):
        (self.root / "package.json").write_text("{}", encoding="utf-8")
        status, output, run = self.invoke("--deep")
        self.assertNotEqual(status, 0)
        self.assertNotIn("verification passed", output.lower())
        run.assert_not_called()

    def test_missing_governance_is_failure(self):
        (self.root / verify.REQUIRED_FILES[0]).unlink()
        status, output, run = self.invoke()
        self.assertNotEqual(status, 0)
        self.assertIn("Missing governance files", output)
        run.assert_not_called()

    def test_deep_runs_every_check_and_propagates_failure(self):
        self.prepare_dependencies()
        status, output, run = self.invoke("--deep", outcomes=[1, 0])
        self.assertNotEqual(status, 0)
        self.assertEqual([call.args[0] for call in run.call_args_list], verify.COMMANDS)
        self.assertIn("Verification failed", output)

    def test_deep_pass_requires_successful_commands(self):
        self.prepare_dependencies()
        status, output, run = self.invoke("--deep", outcomes=[0, 0])
        self.assertEqual(status, 0)
        self.assertEqual(run.call_count, len(verify.COMMANDS))
        self.assertIn("Deep verification passed", output)

    def test_deep_rejects_unconfigured_commands(self):
        self.prepare_dependencies()
        with patch.object(verify, "COMMANDS", []):
            status, output, run = self.invoke("--deep")
        self.assertNotEqual(status, 0)
        self.assertIn("incomplete", output.lower())
        run.assert_not_called()


if __name__ == "__main__":
    main()

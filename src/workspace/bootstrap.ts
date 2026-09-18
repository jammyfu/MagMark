import { mountWorkspaceIcons } from './icons';

// Paint readable chrome before downloading/evaluating the editing engine.
document.body.dataset.workspace = matchMedia('(max-width: 800px)').matches ? 'write' : 'compare';
mountWorkspaceIcons();
const notice = document.createElement('div');
notice.className = 'workspace-loading';
notice.setAttribute('role', 'status');
notice.textContent = '正在准备编辑器…';
document.body.append(notice);
const main = document.getElementById('workspace-main')!;
const header = document.getElementById('app-header')!;
main.inert = header.inert = true;

void import('../../app').then(() => {
  notice.remove();
  main.inert = header.inert = false;
  // Optional desktop article fonts must never block the first paint.
  if (!matchMedia('(max-width: 800px)').matches) {
    const fonts = document.createElement('link');
    fonts.rel = 'stylesheet';
    fonts.href = 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&family=Noto+Sans+SC:wght@300;400;500;600&family=LXGW+WenKai:wght@300;400;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap';
    document.head.append(fonts);
  }
}).catch(() => {
  notice.textContent = '编辑器加载失败，请检查网络后重试。';
  const retry = document.createElement('button');
  retry.textContent = '重新加载';
  retry.onclick = () => location.reload();
  notice.append(retry);
});

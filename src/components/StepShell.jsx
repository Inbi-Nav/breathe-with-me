import Wordmark from './Wordmark';

export default function StepShell({ title, art, children }) {
  return (
    <div className="shell">
      <aside className="shell-art">
        <div className="shell-brand">
          <Wordmark size="sm" />
          <h1>{title}</h1>
        </div>
        <div className="shell-art-canvas">{art}</div>
      </aside>
      <section className="shell-main">
        <div className="shell-body">{children}</div>
      </section>
    </div>
  );
}

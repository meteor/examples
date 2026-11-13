// A small custom element: one bar per column, sized by its card count. It
// takes its data through a property, as most web components do, so Blaze
// cannot feed it from an attribute (attributes are strings): the boardChart
// template sets `element.data` from an autorun instead.
class BoardChart extends HTMLElement {
  #data = [];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host { display: flex; gap: 2px; height: 0.6rem; min-width: 8rem; border-radius: 999px; overflow: hidden; }
        span { flex: 1 1 0; background: var(--chart-bar, #94a3b8); transition: flex-grow 0.3s; }
        span:nth-child(3n + 2) { background: var(--chart-bar-2, #2563eb); }
        span:nth-child(3n) { background: var(--chart-bar-3, #16a34a); }
      </style>`;
  }

  get data() {
    return this.#data;
  }

  set data(columns) {
    this.#data = columns;
    const bars = columns.map(({ title, count }) => {
      const bar = document.createElement('span');
      bar.style.flexGrow = Math.max(count, 0.15);
      bar.title = `${title}: ${count}`;
      return bar;
    });
    this.shadowRoot.replaceChildren(this.shadowRoot.firstElementChild, ...bars);
  }
}

customElements.define('board-chart', BoardChart);

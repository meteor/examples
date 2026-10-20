import Chart from 'chart.js/auto';

export function createCallsChart(canvas) {
  return new Chart(canvas, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        { label: 'Calls', data: [], borderColor: '#2563eb', backgroundColor: '#2563eb', pointRadius: 0, tension: 0.2 },
        { label: 'Errors', data: [], borderColor: '#dc2626', backgroundColor: '#dc2626', pointRadius: 0, tension: 0.2 },
      ],
    },
    options: {
      animation: false,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
    },
  });
}

export function updateCallsChart(chart, series) {
  chart.data.labels = series.map((point) =>
    new Date(point.minute).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  chart.data.datasets[0].data = series.map((point) => point.calls);
  chart.data.datasets[1].data = series.map((point) => point.errors);
  chart.update('none');
}

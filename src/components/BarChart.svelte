<script lang="ts">
  import { onMount } from 'svelte';
  import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend, BarController } from 'chart.js';

  Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, BarController);

  interface BarChartData {
    month: string;
    income: number;
    expense: number;
    balance: number;
  }

  let { data = [] }: { data: BarChartData[] } = $props();
  let canvas: HTMLCanvasElement;
  let chart: Chart | null = null;

  onMount(() => {
    return () => {
      if (chart) {
        chart.destroy();
      }
    };
  });

  $effect(() => {
    if (!canvas) return;

    if (chart) {
      chart.destroy();
    }

    if (data.length === 0) return;

    chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: data.map(d => d.month),
        datasets: [
          {
            label: 'Revenus',
            data: data.map(d => d.income),
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderColor: 'rgb(16, 185, 129)',
            borderWidth: 2,
            borderRadius: 6
          },
          {
            label: 'Dépenses',
            data: data.map(d => d.expense),
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            borderColor: 'rgb(239, 68, 68)',
            borderWidth: 2,
            borderRadius: 6
          },
          {
            label: 'Solde',
            data: data.map(d => d.balance),
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 2,
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              padding: 15,
              font: {
                size: 13,
                family: "'Inter', sans-serif",
                weight: '500'
              },
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: {
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              size: 13
            },
            callbacks: {
              label: function(context: any) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                const value = context.parsed.y;
                label += value.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' €';
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value: any) {
                return value.toLocaleString('fr-FR') + ' €';
              },
              font: {
                size: 11
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 11
              }
            }
          }
        }
      }
    });
  });
</script>

<div class="w-full h-full">
  {#if data.length > 0}
    <canvas bind:this={canvas}></canvas>
  {:else}
    <div class="flex items-center justify-center h-full">
      <p class="text-slate-400 italic">Aucune donnée disponible</p>
    </div>
  {/if}
</div>

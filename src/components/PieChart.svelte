<script lang="ts">
  import { onMount } from 'svelte';
  import { Chart, ArcElement, Tooltip, Legend, PieController } from 'chart.js';

  Chart.register(ArcElement, Tooltip, Legend, PieController);

  interface PieChartData {
    category: string;
    value: number;
    color: string;
  }

  let { data = [] }: { data: PieChartData[] } = $props();
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
      type: 'doughnut',
      data: {
        labels: data.map(d => d.category),
        datasets: [{
          data: data.map(d => d.value),
          backgroundColor: data.map(d => d.color),
          borderColor: '#fff',
          borderWidth: 2,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              font: {
                size: 12,
                family: "'Inter', sans-serif"
              },
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value.toLocaleString('fr-FR')} € (${percentage}%)`;
              }
            },
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: {
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              size: 13
            }
          }
        }
      }
    });
  });
</script>

<div class="w-full h-full flex items-center justify-center">
  {#if data.length > 0}
    <div class="w-full max-w-md h-full">
      <canvas bind:this={canvas}></canvas>
    </div>
  {:else}
    <p class="text-slate-400 italic">Aucune dépense pour ce mois</p>
  {/if}
</div>

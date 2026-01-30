<script lang="ts">
  import { Calendar, ChevronLeft, ChevronRight } from 'lucide-svelte';
  
  interface Props {
    value: string;
    onChange: (date: string) => void;
    label?: string;
  }
  
  let { value, onChange, label }: Props = $props();
  
  let isOpen = $state(false);
  let viewDate = $state((() => {
    const [year, month] = value.split('-').map(Number);
    return new Date(year, month - 1, 1);
  })());
  let containerRef: HTMLDivElement;

  const formatDisplayDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const goToPreviousMonth = () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
  };

  const goToNextMonth = () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
  };

  const selectDate = (day: number) => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth() + 1;
    const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(formattedDate);
    isOpen = false;
  };

  const selectToday = () => {
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    onChange(formattedDate);
    viewDate = new Date(today.getFullYear(), today.getMonth(), 1);
    isOpen = false;
  };

  const getDaysInMonth = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;

    const days: (number | null)[] = [];
    
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const isSelectedDate = (day: number) => {
    const [selectedYear, selectedMonth, selectedDay] = value.split('-').map(Number);
    return selectedYear === viewDate.getFullYear() && 
           selectedMonth === (viewDate.getMonth() + 1) && 
           selectedDay === day;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getFullYear() === viewDate.getFullYear() && 
           today.getMonth() === viewDate.getMonth() && 
           today.getDate() === day;
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (containerRef && !containerRef.contains(event.target as Node)) {
      isOpen = false;
    }
  };

  $effect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  });

  const days = $derived(getDaysInMonth());
  const monthName = $derived(viewDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }));
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
</script>

<div class="relative" bind:this={containerRef}>
  {#if label}
    <label class="block text-sm font-medium text-slate-600 mb-1">{label}</label>
  {/if}
  
  <button
    type="button"
    on:click={() => isOpen = !isOpen}
    class="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all flex items-center gap-2 text-left"
  >
    <Calendar size={18} class="text-slate-400 flex-shrink-0" />
    <span class="text-slate-700 flex-1 font-medium">{formatDisplayDate(value)}</span>
  </button>

  {#if isOpen}
    <div class="absolute z-[9999] bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 w-[320px] animate-in fade-in zoom-in duration-150">
      
      <div class="flex items-center justify-between mb-4">
        <button
          type="button"
          on:click={goToPreviousMonth}
          class="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
        >
          <ChevronLeft size={20} />
        </button>
        
        <h3 class="font-bold text-slate-800 capitalize text-base">
          {monthName}
        </h3>
        
        <button
          type="button"
          on:click={goToNextMonth}
          class="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <button
        type="button"
        on:click={selectToday}
        class="w-full mb-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
      >
        Aujourd'hui
      </button>

      <div class="grid grid-cols-7 gap-1 mb-2">
        {#each weekDays as day}
          <div class="text-center text-xs font-semibold text-slate-400 py-2">
            {day}
          </div>
        {/each}
      </div>

      <div class="grid grid-cols-7 gap-1">
        {#each days as day, index}
          {#if day === null}
            <div class="aspect-square"></div>
          {:else}
            {@const selected = isSelectedDate(day)}
            {@const today = isToday(day)}
            <button
              type="button"
              on:click={() => selectDate(day)}
              class="aspect-square rounded-lg text-sm font-medium transition-all {selected 
                ? 'bg-slate-900 text-white shadow-md' 
                : today
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'text-slate-700 hover:bg-slate-100'}"
            >
              {day}
            </button>
          {/if}
        {/each}
      </div>

      <div class="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2">
        <button
          type="button"
          on:click={() => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const formatted = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
            onChange(formatted);
            viewDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), 1);
            isOpen = false;
          }}
          class="text-xs py-2 px-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-600 font-medium transition-colors"
        >
          Hier
        </button>
        <button
          type="button"
          on:click={selectToday}
          class="text-xs py-2 px-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-600 font-medium transition-colors"
        >
          Aujourd'hui
        </button>
        <button
          type="button"
          on:click={() => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const formatted = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
            onChange(formatted);
            viewDate = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), 1);
            isOpen = false;
          }}
          class="text-xs py-2 px-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-600 font-medium transition-colors"
        >
          Demain
        </button>
      </div>
    </div>
  {/if}
</div>

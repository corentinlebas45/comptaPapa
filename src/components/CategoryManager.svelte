<script lang="ts">
  import { X, Plus, Trash2, Tag } from 'lucide-svelte';

  interface Props {
    categories: string[];
    onSave: (categories: string[]) => void;
    onClose: () => void;
  }

  let { categories, onSave, onClose }: Props = $props();

  let localCategories = $state([...categories]);
  let newCategoryName = $state('');

  const addCategory = () => {
    const trimmed = newCategoryName.trim();
    if (trimmed && !localCategories.includes(trimmed)) {
      localCategories = [...localCategories, trimmed];
      newCategoryName = '';
    }
  };

  const removeCategory = (category: string) => {
    if (confirm(`Supprimer la catégorie "${category}" ?`)) {
      localCategories = localCategories.filter(c => c !== category);
    }
  };

  const handleSave = () => {
    onSave(localCategories);
    onClose();
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCategory();
    }
  };
</script>

<div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
  <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
    
    <div class="flex justify-between items-center p-6 border-b border-slate-200">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
          <Tag size={20} />
        </div>
        <div>
          <h2 class="text-xl font-bold text-slate-900">Gérer les catégories</h2>
          <p class="text-sm text-slate-500">Personnalisez vos catégories</p>
        </div>
      </div>
      <button 
        onclick={onClose}
        class="w-10 h-10 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
      >
        <X size={20} />
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-6 space-y-6">
      
      <div>
        <label class="block text-sm font-semibold text-slate-700 mb-2">
          Ajouter une catégorie
        </label>
        <div class="flex gap-2">
          <input 
            type="text" 
            bind:value={newCategoryName}
            onkeypress={handleKeyPress}
            placeholder="Ex: Shopping, Cadeaux..."
            class="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all"
          />
          <button 
            onclick={addCategory}
            disabled={!newCategoryName.trim()}
            class="px-4 py-2.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      <div>
        <label class="block text-sm font-semibold text-slate-700 mb-3">
          Catégories actuelles ({localCategories.length})
        </label>
        <div class="space-y-2 max-h-64 overflow-y-auto">
          {#if localCategories.length === 0}
            <div class="text-center py-8 text-slate-400">
              Aucune catégorie. Ajoutez-en une ci-dessus.
            </div>
          {:else}
            {#each localCategories as category}
              <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors group">
                <span class="font-medium text-slate-700">{category}</span>
                <button 
                  onclick={() => removeCategory(category)}
                  class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            {/each}
          {/if}
        </div>
      </div>
    </div>

    <div class="p-6 border-t border-slate-200 flex gap-3">
      <button 
        onclick={onClose}
        class="flex-1 px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all"
      >
        Annuler
      </button>
      <button 
        onclick={handleSave}
        class="flex-1 px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all shadow-md"
      >
        Enregistrer
      </button>
    </div>

  </div>
</div>

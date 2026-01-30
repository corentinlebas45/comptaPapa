<script lang="ts">
    import { Plus, X, Repeat } from "lucide-svelte";
    import type { Transaction, TransactionType, Category } from "../types.ts";
    import DatePicker from "./DatePicker.svelte";

    interface Props {
        onAdd: (transactions: Omit<Transaction, "id">[]) => void;
        onClose: () => void;
        initialDate?: Date;
        categories: string[];
    }

    let { onAdd, onClose, initialDate, categories }: Props = $props();

    let type = $state<TransactionType>("expense");
    let amount = $state("");
    let description = $state("");
    let category = $state<Category>(categories[0] || "Autre");

    let date = $state(
        (() => {
            const d = initialDate || new Date();
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        })(),
    );

    let isRecurring = $state(false);

    const handleSubmit = (e: Event) => {
        e.preventDefault();
        if (!amount) return;

        const parsedAmount = parseFloat(amount);
        const newTransactions: Omit<Transaction, "id">[] = [];

        const [year, month, day] = date.split("-").map(Number);

        const repeatCount = isRecurring ? 12 : 1;

        const finalDescription = description.trim() || category;

        for (let i = 0; i < repeatCount; i++) {
            const targetMonth = month - 1 + i;
            const targetYear = year + Math.floor(targetMonth / 12);
            const targetMonthIndex = targetMonth % 12;

            const lastDayOfMonth = new Date(
                targetYear,
                targetMonthIndex + 1,
                0,
            ).getDate();
            const targetDay = Math.min(day, lastDayOfMonth);

            const formattedDate = `${targetYear}-${String(targetMonthIndex + 1).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`;

            newTransactions.push({
                date: formattedDate,
                amount: parsedAmount,
                description: finalDescription,
                category,
                type,
            });
        }

        onAdd(newTransactions);
        onClose();
    };
</script>

<div
    class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
>
    <div
        class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-visible animate-in fade-in zoom-in duration-200"
    >
        <div
            class="flex justify-between items-center p-6 border-b border-slate-100"
        >
            <h2 class="text-xl font-bold text-slate-800">Nouvelle Opération</h2>
            <button
                onclick={onClose}
                class="text-slate-400 hover:text-slate-600 transition-colors"
            >
                <X size={24} />
            </button>
        </div>

        <form onsubmit={handleSubmit} class="p-6 space-y-5">
            <div class="flex p-1 bg-slate-100 rounded-lg">
                <button
                    type="button"
                    onclick={() => (type = "expense")}
                    class="flex-1 py-2 text-sm font-medium rounded-md transition-all {type ===
                    'expense'
                        ? 'bg-white text-red-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'}"
                >
                    Dépense
                </button>
                <button
                    type="button"
                    onclick={() => (type = "income")}
                    class="flex-1 py-2 text-sm font-medium rounded-md transition-all {type ===
                    'income'
                        ? 'bg-white text-emerald-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'}"
                >
                    Revenu
                </button>
            </div>

            <div>
                <label class="block text-sm font-medium text-slate-600 mb-1"
                    >Montant (€)</label
                >
                <input
                    type="number"
                    step="0.01"
                    required
                    bind:value={amount}
                    class="w-full text-3xl font-bold text-slate-800 border-b-2 border-slate-200 focus:border-blue-500 outline-none py-2 placeholder-slate-300 bg-transparent"
                    placeholder="0.00"
                    autofocus
                />
            </div>

            <div>
                <label class="block text-sm font-medium text-slate-600 mb-1">
                    Description <span class="text-slate-400 font-normal"
                        >(Optionnel)</span
                    >
                </label>
                <input
                    type="text"
                    bind:value={description}
                    class="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="Ex: {category}..."
                />
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-slate-600 mb-1"
                        >Catégorie</label
                    >
                    <select
                        bind:value={category}
                        class="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    >
                        {#each categories as c}
                            <option value={c}>{c}</option>
                        {/each}
                    </select>
                </div>
                <div>
                    <DatePicker
                        value={date}
                        onChange={(newDate: string) => (date = newDate)}
                        label="Date"
                    />
                </div>
            </div>

            <div
                class="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors"
                onclick={() => (isRecurring = !isRecurring)}
            >
                <div
                    class="w-5 h-5 rounded border flex items-center justify-center transition-colors {isRecurring
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white border-slate-300'}"
                >
                    {#if isRecurring}
                        <Repeat size={12} />
                    {/if}
                </div>
                <div class="flex-1 select-none">
                    <p class="text-sm font-medium text-slate-700">
                        Répéter tous les mois
                    </p>
                    <p class="text-xs text-slate-400">
                        Ajoutera cette opération pour les 12 prochains mois
                    </p>
                </div>
            </div>

            <button
                type="submit"
                class="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 mt-4"
            >
                <Plus size={20} />
                {isRecurring
                    ? "Ajouter pour toute l'année"
                    : "Ajouter l'opération"}
            </button>
        </form>
    </div>
</div>

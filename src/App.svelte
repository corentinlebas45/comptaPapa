<script lang="ts">
    import {
        Wallet,
        TrendingUp,
        TrendingDown,
        Search,
        Trash2,
        PieChart as PieChartIcon,
        List as ListIcon,
        BarChart3,
        ChevronLeft,
        ChevronRight,
        Target,
        ArrowLeft,
        LayoutGrid,
        Pencil,
        Check,
        X,
        Settings,
    } from "lucide-svelte";

    import type { Transaction, Category, CategoryDef } from "./types.ts";
    import { DefaultCategories } from "./types.ts";
    import { saveAppData, loadAppData } from "./services/storageService";
    import TransactionForm from "./components/TransactionForm.svelte";
    import DatePicker from "./components/DatePicker.svelte";
    import StatsCard from "./components/StatsCard.svelte";
    import PieChart from "./components/PieChart.svelte";
    import BarChart from "./components/BarChart.svelte";
    import CategoryManager from "./components/CategoryManager.svelte";

    // State
    let transactions = $state<Transaction[]>([]);
    let categories = $state<CategoryDef[]>([...DefaultCategories]);
    let initialBalance = $state(0);
    let isFormOpen = $state(false);
    let isCategoryManagerOpen = $state(false);
    let filterCategory = $state<Category | "All">("All");
    let activeTab = $state<"list" | "chart" | "evolution">("list");
    let isLoaded = $state(false);

    let isEditingBalance = $state(false);
    let tempBalanceValue = $state("");

    let viewScope = $state<"year" | "month">("year");
    let currentDate = $state(new Date());

    let fastAdd = $state<{
        date: string;
        description: string;
        category: string;
        amount: string;
        type: "income" | "expense";
        statementNumber: string;
    }>({
        date: new Date().toISOString().split("T")[0],
        description: "",
        category: "Alimentation",
        amount: "",
        type: "expense",
        statementNumber: "",
    });

    // Make sure fastAdd date follows the view navigation
    $effect(() => {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, "0");
        // Default to 1st of the viewed month
        fastAdd.date = `${year}-${month}-01`;
    });

    // Charger les données au montage
    $effect(() => {
        const initData = async () => {
            const data = await loadAppData();
            transactions = data.transactions;
            initialBalance = data.initialBalance;
            if (data.categories && data.categories.length > 0) {
                // Ensure loaded categories are compatible (storageService handles migration but ensuring type safety)
                categories = data.categories as CategoryDef[];
            }
            isLoaded = true;
        };
        initData();
    });

    // Sauvegarder quand les données changent
    $effect(() => {
        if (isLoaded) {
            saveAppData({ transactions, initialBalance, categories });
        }
    });

    // Navigation helpers
    const goToPreviousYear = () => {
        currentDate = new Date(
            currentDate.getFullYear() - 1,
            currentDate.getMonth(),
            1,
        );
    };
    const goToNextYear = () => {
        currentDate = new Date(
            currentDate.getFullYear() + 1,
            currentDate.getMonth(),
            1,
        );
    };
    const goToPreviousMonth = () => {
        currentDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() - 1,
            1,
        );
    };
    const goToNextMonth = () => {
        currentDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() + 1,
            1,
        );
    };

    const getCategoryColor = (name: string) => {
        return categories.find((c) => c.name === name)?.color || "#64748b";
    };

    const enterMonthDetail = (monthIndex: number) => {
        currentDate = new Date(currentDate.getFullYear(), monthIndex, 1);
        viewScope = "month";
    };

    const backToYearView = () => {
        viewScope = "year";
    };

    const formatMonthTitle = (date: Date) => {
        return date.toLocaleDateString("fr-FR", {
            month: "long",
            year: "numeric",
        });
    };

    // Derived data
    const globalBalance = $derived.by(() => {
        const today = new Date().toISOString().split("T")[0];
        const pastTransactions = transactions.filter((t) => t.date <= today);
        const totalDiff = pastTransactions.reduce((acc, curr) => {
            return curr.type === "income"
                ? acc + curr.amount
                : acc - curr.amount;
        }, 0);
        return initialBalance + totalDiff;
    });

    const yearData = $derived.by(() => {
        const year = currentDate.getFullYear();
        const today = new Date().toISOString().split("T")[0];

        const months = Array.from({ length: 12 }, (_, i) => {
            const monthStart = new Date(year, i, 1);
            const monthKey = `${year}-${String(i + 1).padStart(2, "0")}`;
            const monthTxs = transactions.filter((t) =>
                t.date.startsWith(monthKey),
            );

            const income = monthTxs
                .filter((t) => t.type === "income")
                .reduce((acc, t) => acc + t.amount, 0);
            const expense = monthTxs
                .filter((t) => t.type === "expense")
                .reduce((acc, t) => acc + t.amount, 0);

            const monthEndDate = `${monthKey}-${String(new Date(year, i + 1, 0).getDate()).padStart(2, "0")}`;

            const txUntilMonthEnd = transactions.filter(
                (t) => t.date <= monthEndDate,
            );
            const totalDiffUntilMonthEnd = txUntilMonthEnd.reduce(
                (acc, curr) => {
                    return curr.type === "income"
                        ? acc + curr.amount
                        : acc - curr.amount;
                },
                0,
            );
            const estimatedBalance = initialBalance + totalDiffUntilMonthEnd;

            return {
                index: i,
                name: monthStart.toLocaleDateString("fr-FR", { month: "long" }),
                key: monthKey,
                income,
                expense,
                balance: income - expense,
                estimatedBalance,
                count: monthTxs.length,
            };
        });

        const totalIncome = months.reduce((acc, m) => acc + m.income, 0);
        const totalExpense = months.reduce((acc, m) => acc + m.expense, 0);
        const totalVariation = totalIncome - totalExpense;

        return { months, totalIncome, totalExpense, totalVariation };
    });

    const monthlyContext = $derived.by(() => {
        if (viewScope === "year") return null;

        const yearStr = currentDate.getFullYear();
        const monthStr = String(currentDate.getMonth() + 1).padStart(2, "0");
        const monthKey = `${yearStr}-${monthStr}`;

        const monthTxs = transactions.filter((t) =>
            t.date.startsWith(monthKey),
        );

        const stats = monthTxs.reduce(
            (acc, curr) => {
                if (curr.type === "income") acc.income += curr.amount;
                else acc.expense += curr.amount;
                return acc;
            },
            { income: 0, expense: 0 },
        );

        let filteredList = [...monthTxs].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
        if (filterCategory !== "All") {
            filteredList = filteredList.filter(
                (t) => t.category === filterCategory,
            );
        }

        const chartDataObj: Record<string, number> = {};
        monthTxs
            .filter((t) => t.type === "expense")
            .forEach((t) => {
                chartDataObj[t.category] =
                    (chartDataObj[t.category] || 0) + t.amount;
            });
        const pieData = Object.keys(chartDataObj)
            .map((key, index) => ({
                category: key,
                value: chartDataObj[key],
                color: COLORS[index % COLORS.length],
            }))
            .filter((item) => item.value > 0);

        return {
            transactions: monthTxs,
            filteredList,
            stats,
            balance: stats.income - stats.expense,
            pieData,
        };
    });

    const barChartData = $derived.by(() => {
        const data: Record<
            string,
            { month: string; income: number; expense: number; balance: number }
        > = {};
        transactions.forEach((t) => {
            const key = t.date.substring(0, 7);
            const dateObj = new Date(t.date);
            const month = dateObj.toLocaleDateString("fr-FR", {
                month: "short",
                year: "2-digit",
            });
            if (!data[key])
                data[key] = { month, income: 0, expense: 0, balance: 0 };

            if (t.type === "income") {
                data[key].income += t.amount;
                data[key].balance += t.amount;
            } else {
                data[key].expense += t.amount;
                data[key].balance -= t.amount;
            }
        });
        return Object.keys(data)
            .sort()
            .map((key) => data[key]);
    });

    // Handlers
    const handleAddTransactions = (newTxs: Omit<Transaction, "id">[]) => {
        const transactionsToAdd: Transaction[] = newTxs.map((tx) => ({
            ...tx,
            id: crypto.randomUUID(),
        }));
        transactions = [...transactionsToAdd, ...transactions];
    };

    const handleDeleteTransaction = (id: string) => {
        if (
            window.confirm("Voulez-vous vraiment supprimer cette opération ?")
        ) {
            transactions = transactions.filter((t) => t.id !== id);
        }
    };

    const handleFastAdd = () => {
        if (!fastAdd.amount || !fastAdd.description) return;

        handleAddTransactions([
            {
                date: fastAdd.date,
                description: fastAdd.description,
                category: fastAdd.category,
                amount: parseFloat(fastAdd.amount.replace(",", ".")),
                type: fastAdd.type,
                statementNumber: fastAdd.statementNumber,
            },
        ]);

        // Reset fields but keep date and category for convenience?
        // User said "quick", usually keeping date is good.
        fastAdd = {
            date: fastAdd.date,
            description: "",
            category: "Alimentation",
            amount: "",
            type: "expense",
            statementNumber: "",
        };
    };

    const handleSaveCategories = (newCategories: CategoryDef[]) => {
        categories = newCategories;
    };

    const startEditingBalance = () => {
        tempBalanceValue = globalBalance.toString();
        isEditingBalance = true;
    };

    const saveBalance = () => {
        const newGlobal = parseFloat(tempBalanceValue);
        if (isNaN(newGlobal)) return;

        const today = new Date().toISOString().split("T")[0];
        const pastTransactions = transactions.filter((t) => t.date <= today);
        const totalDiff = pastTransactions.reduce((acc, curr) => {
            return curr.type === "income"
                ? acc + curr.amount
                : acc - curr.amount;
        }, 0);

        initialBalance = newGlobal - totalDiff;
        isEditingBalance = false;
    };

    const COLORS = [
        "#10B981",
        "#3B82F6",
        "#6366F1",
        "#8B5CF6",
        "#EC4899",
        "#F43F5E",
        "#F59E0B",
        "#64748B",
        "#0F172A",
    ];
</script>

{#if !isLoaded}
    <div class="min-h-screen bg-slate-50 flex items-center justify-center">
        <div class="text-slate-500 animate-pulse">
            Chargement de vos comptes...
        </div>
    </div>
{:else}
    <div class="min-h-screen bg-slate-50 text-slate-800 pb-20 font-sans">
        <header
            class="bg-white border-b border-slate-200 sticky top-0 z-30 select-none drag-region shadow-sm"
        >
            <div
                class="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4"
            >
                <div
                    class="flex items-center gap-3 self-start md:self-auto min-w-[200px]"
                >
                    {#if viewScope === "month"}
                        <button
                            onclick={backToYearView}
                            class="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl flex items-center justify-center transition-colors"
                            title="Retour à l'année"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    {:else}
                        <div
                            class="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg"
                        >
                            <Wallet size={20} />
                        </div>
                    {/if}

                    <div>
                        <h1
                            class="font-bold text-xl leading-tight text-slate-900"
                        >
                            {viewScope === "year"
                                ? "ComptaPapa"
                                : "Détail du Mois"}
                        </h1>
                        <p class="text-xs text-slate-500 font-medium">
                            {viewScope === "year"
                                ? "Tableau de bord annuel"
                                : "Gestion détaillée"}
                        </p>
                    </div>
                </div>

                <div
                    class="flex items-center bg-slate-100 rounded-full p-1 shadow-inner"
                >
                    <button
                        onclick={viewScope === "year"
                            ? goToPreviousYear
                            : goToPreviousMonth}
                        class="p-2 hover:bg-white rounded-full transition-all text-slate-600 active:scale-95"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div
                        class="px-6 font-bold text-slate-800 w-48 text-center capitalize select-none text-lg"
                    >
                        {viewScope === "year"
                            ? currentDate.getFullYear()
                            : formatMonthTitle(currentDate)}
                    </div>
                    <button
                        onclick={viewScope === "year"
                            ? goToNextYear
                            : goToNextMonth}
                        class="p-2 hover:bg-white rounded-full transition-all text-slate-600 active:scale-95"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div
                    class="flex gap-2 self-end md:self-auto min-w-[200px] justify-end"
                >
                    <button
                        onclick={() => (isCategoryManagerOpen = true)}
                        class="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl font-semibold shadow-sm transition-all active:scale-95 flex items-center gap-2"
                        title="Gérer les catégories"
                    >
                        <Settings size={18} />
                    </button>
                    <button
                        onclick={() => (isFormOpen = true)}
                        class="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all active:scale-95 flex items-center gap-2"
                    >
                        <span class="text-xl leading-none mb-0.5">+</span>
                        <span class="hidden sm:inline">Ajouter</span>
                    </button>
                </div>
            </div>
        </header>

        <main class="max-w-6xl mx-auto px-4 py-8 space-y-6">
            {#if viewScope === "year"}
                <div class="space-y-6 animate-in fade-in duration-300">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div
                            class="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden group"
                        >
                            <div>
                                <div
                                    class="flex justify-between items-start z-10 relative"
                                >
                                    <p class="text-slate-300 font-medium mb-1">
                                        Solde Actuel (En Banque)
                                    </p>
                                    {#if !isEditingBalance}
                                        <button
                                            onclick={startEditingBalance}
                                            class="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
                                            title="Modifier le solde actuel"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                    {:else}
                                        <div class="flex gap-2">
                                            <button
                                                onclick={saveBalance}
                                                class="p-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg"
                                                ><Check size={14} /></button
                                            >
                                            <button
                                                onclick={() =>
                                                    (isEditingBalance = false)}
                                                class="p-1.5 bg-red-600 hover:bg-red-500 rounded-lg"
                                                ><X size={14} /></button
                                            >
                                        </div>
                                    {/if}
                                </div>

                                {#if isEditingBalance}
                                    <input
                                        type="number"
                                        bind:value={tempBalanceValue}
                                        class="text-4xl font-bold bg-transparent border-b-2 border-slate-500 focus:border-emerald-400 outline-none w-full text-white placeholder-slate-600"
                                        autofocus
                                    />
                                {:else}
                                    <h2
                                        class="text-4xl font-bold tracking-tight {globalBalance >=
                                        0
                                            ? 'text-emerald-400'
                                            : 'text-red-400'}"
                                    >
                                        {globalBalance > 0
                                            ? "+"
                                            : ""}{globalBalance.toLocaleString(
                                            "fr-FR",
                                            {
                                                style: "currency",
                                                currency: "EUR",
                                            },
                                        )}
                                    </h2>
                                {/if}
                            </div>

                            <div
                                class="mt-4 pt-4 border-t border-slate-700/50 flex justify-between items-end z-10 relative"
                            >
                                <p class="text-xs text-slate-400">
                                    Variation Annuelle {currentDate.getFullYear()}:
                                    <span
                                        class={yearData.totalVariation >= 0
                                            ? "text-emerald-400"
                                            : "text-red-400"}
                                    >
                                        {yearData.totalVariation > 0
                                            ? "+"
                                            : ""}{yearData.totalVariation.toLocaleString(
                                            "fr-FR",
                                            { maximumFractionDigits: 0 },
                                        )} €
                                    </span>
                                </p>
                            </div>

                            <div
                                class="absolute right-4 top-4 opacity-10 group-hover:opacity-20 transition-opacity"
                            >
                                <Target size={64} />
                            </div>
                        </div>

                        <StatsCard
                            title="Revenus {currentDate.getFullYear()}"
                            amount={yearData.totalIncome}
                            icon={TrendingUp}
                            colorClass="text-emerald-600"
                            bgClass="bg-emerald-50"
                        />
                        <StatsCard
                            title="Dépenses {currentDate.getFullYear()}"
                            amount={yearData.totalExpense}
                            icon={TrendingDown}
                            colorClass="text-red-600"
                            bgClass="bg-red-50"
                        />
                    </div>

                    <div
                        class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                    >
                        <div
                            class="p-4 border-b border-slate-100 flex items-center gap-2"
                        >
                            <LayoutGrid class="text-slate-400" size={20} />
                            <h3 class="font-bold text-slate-800">
                                Synthèse mensuelle {currentDate.getFullYear()}
                            </h3>
                        </div>

                        <div class="overflow-x-auto">
                            <table class="w-full text-left border-collapse">
                                <thead>
                                    <tr
                                        class="bg-slate-50 text-slate-500 text-xs uppercase font-semibold tracking-wider border-b border-slate-200"
                                    >
                                        <th class="px-6 py-4">Mois</th>
                                        <th
                                            class="px-6 py-4 text-right text-emerald-600"
                                            >Entrées</th
                                        >
                                        <th
                                            class="px-6 py-4 text-right text-red-600"
                                            >Sorties</th
                                        >
                                        <th
                                            class="px-6 py-4 text-right text-slate-800"
                                            >Résultat</th
                                        >
                                        <th
                                            class="px-6 py-4 text-right text-blue-600"
                                            >Solde Estimé</th
                                        >
                                        <th class="px-6 py-4 text-center"
                                            >Opérations</th
                                        >
                                        <th class="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100">
                                    {#each yearData.months as month}
                                        {@const isCurrent =
                                            new Date().getMonth() ===
                                                month.index &&
                                            new Date().getFullYear() ===
                                                currentDate.getFullYear()}
                                        <tr
                                            onclick={() =>
                                                enterMonthDetail(month.index)}
                                            class="group cursor-pointer transition-colors {isCurrent
                                                ? 'bg-blue-50/50 hover:bg-blue-50'
                                                : 'hover:bg-slate-50'}"
                                        >
                                            <td class="px-6 py-4">
                                                <div
                                                    class="flex items-center gap-2"
                                                >
                                                    <span
                                                        class="font-bold capitalize {isCurrent
                                                            ? 'text-blue-700'
                                                            : 'text-slate-700'}"
                                                    >
                                                        {month.name}
                                                    </span>
                                                    {#if isCurrent}
                                                        <span
                                                            class="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold"
                                                            >Actuel</span
                                                        >
                                                    {/if}
                                                </div>
                                            </td>
                                            <td
                                                class="px-6 py-4 text-right font-medium text-emerald-600"
                                            >
                                                {month.income > 0
                                                    ? `+${month.income.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €`
                                                    : "-"}
                                            </td>
                                            <td
                                                class="px-6 py-4 text-right font-medium text-red-600"
                                            >
                                                {month.expense > 0
                                                    ? `-${month.expense.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €`
                                                    : "-"}
                                            </td>
                                            <td
                                                class="px-6 py-4 text-right font-bold tabular-nums"
                                            >
                                                <span
                                                    class="px-3 py-1 rounded-lg {month.balance >=
                                                    0
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-red-50 text-red-700'}"
                                                >
                                                    {month.balance > 0
                                                        ? "+"
                                                        : ""}{month.balance.toLocaleString(
                                                        "fr-FR",
                                                        {
                                                            maximumFractionDigits: 2,
                                                        },
                                                    )} €
                                                </span>
                                            </td>
                                            <td
                                                class="px-6 py-4 text-right font-semibold"
                                            >
                                                <span
                                                    class="px-3 py-1 rounded-lg {month.estimatedBalance >=
                                                    0
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-orange-100 text-orange-700'}"
                                                >
                                                    {month.estimatedBalance.toLocaleString(
                                                        "fr-FR",
                                                        {
                                                            maximumFractionDigits: 2,
                                                        },
                                                    )} €
                                                </span>
                                            </td>
                                            <td
                                                class="px-6 py-4 text-center text-slate-400 text-sm"
                                            >
                                                {month.count > 0
                                                    ? `${month.count}`
                                                    : "-"}
                                            </td>
                                            <td class="px-6 py-4 text-right">
                                                <ChevronRight
                                                    class="inline-block text-slate-300 group-hover:text-slate-500 transition-colors"
                                                    size={20}
                                                />
                                            </td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            {/if}

            {#if viewScope === "month" && monthlyContext}
                <div
                    class="space-y-6 animate-in slide-in-from-right-4 duration-300"
                >
                    <div
                        class="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100"
                    >
                        <div
                            class="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto"
                        >
                            <button
                                onclick={() => (activeTab = "list")}
                                class="flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 justify-center whitespace-nowrap {activeTab ===
                                'list'
                                    ? 'bg-white shadow-sm text-slate-900'
                                    : 'text-slate-500 hover:text-slate-700'}"
                            >
                                <ListIcon size={16} /> Opérations
                            </button>
                            <button
                                onclick={() => (activeTab = "chart")}
                                class="flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 justify-center whitespace-nowrap {activeTab ===
                                'chart'
                                    ? 'bg-white shadow-sm text-slate-900'
                                    : 'text-slate-500 hover:text-slate-700'}"
                            >
                                <PieChartIcon size={16} /> Répartition
                            </button>
                            <button
                                onclick={() => (activeTab = "evolution")}
                                class="flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 justify-center whitespace-nowrap {activeTab ===
                                'evolution'
                                    ? 'bg-white shadow-sm text-slate-900'
                                    : 'text-slate-500 hover:text-slate-700'}"
                            >
                                <BarChart3 size={16} /> Historique
                            </button>
                        </div>

                        {#if activeTab === "list"}
                            <div class="relative w-full sm:w-64">
                                <Search
                                    class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    size={16}
                                />
                                <select
                                    bind:value={filterCategory}
                                    class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 appearance-none cursor-pointer"
                                >
                                    <option value="All"
                                        >Toutes les catégories</option
                                    >
                                    {#each categories as c}
                                        <option value={c}>{c}</option>
                                    {/each}
                                </select>
                            </div>
                        {/if}
                    </div>

                    <div
                        class="bg-white rounded-2xl shadow-sm border border-slate-100 min-h-[400px]"
                    >
                        {#if activeTab === "list"}
                            <div class="overflow-x-auto">
                                <div
                                    class="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 border-b border-slate-100 bg-slate-50/50"
                                >
                                    <div
                                        class="bg-emerald-50 p-4 rounded-xl border border-emerald-100"
                                    >
                                        <p
                                            class="text-emerald-600 text-xs font-bold uppercase"
                                        >
                                            Entrées
                                        </p>
                                        <p
                                            class="text-xl font-bold text-emerald-700"
                                        >
                                            +{monthlyContext.stats.income.toLocaleString(
                                                "fr-FR",
                                            )} €
                                        </p>
                                    </div>
                                    <div
                                        class="bg-red-50 p-4 rounded-xl border border-red-100"
                                    >
                                        <p
                                            class="text-red-600 text-xs font-bold uppercase"
                                        >
                                            Sorties
                                        </p>
                                        <p
                                            class="text-xl font-bold text-red-700"
                                        >
                                            -{monthlyContext.stats.expense.toLocaleString(
                                                "fr-FR",
                                            )} €
                                        </p>
                                    </div>
                                    <div
                                        class="p-4 rounded-xl border {monthlyContext.balance >=
                                        0
                                            ? 'bg-blue-50 border-blue-100'
                                            : 'bg-orange-50 border-orange-100'}"
                                    >
                                        <p
                                            class="text-slate-600 text-xs font-bold uppercase"
                                        >
                                            Reste (Mois)
                                        </p>
                                        <p
                                            class="text-xl font-bold {monthlyContext.balance >=
                                            0
                                                ? 'text-blue-700'
                                                : 'text-orange-700'}"
                                        >
                                            {monthlyContext.balance > 0
                                                ? "+"
                                                : ""}{monthlyContext.balance.toLocaleString(
                                                "fr-FR",
                                            )} €
                                        </p>
                                    </div>
                                </div>

                                <table class="w-full text-left border-collapse">
                                    <thead
                                        class="bg-white text-slate-500 text-xs uppercase font-semibold tracking-wider border-b border-slate-100"
                                    >
                                        <tr>
                                            <th class="px-6 py-4">Date</th>
                                            <th class="px-6 py-4"
                                                >Description</th
                                            >
                                            <th class="px-6 py-4">Catégorie</th>
                                            <th class="px-6 py-4 text-right"
                                                >Montant</th
                                            >
                                            <th class="px-6 py-4 text-center"
                                                >N° Relevé</th
                                            >
                                            <th class="px-6 py-4 text-center"
                                                >Action</th
                                            >
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-slate-100">
                                        {#if monthlyContext.filteredList.length === 0}
                                            <tr>
                                                <td
                                                    colspan="5"
                                                    class="px-6 py-12 text-center text-slate-400"
                                                >
                                                    Aucune opération trouvée
                                                    pour ce mois.
                                                </td>
                                            </tr>
                                        {:else}
                                            {#each monthlyContext.filteredList as tx}
                                                <tr
                                                    class="hover:bg-slate-50 transition-colors group"
                                                >
                                                    <td
                                                        class="px-6 py-4 text-sm text-slate-600"
                                                    >
                                                        <div class="w-32">
                                                            <DatePicker
                                                                value={tx.date}
                                                                onChange={(
                                                                    newDate,
                                                                ) =>
                                                                    (tx.date =
                                                                        newDate)}
                                                                variant="table"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td
                                                        class="px-6 py-4 font-medium text-slate-800"
                                                    >
                                                        <input
                                                            type="text"
                                                            bind:value={
                                                                tx.description
                                                            }
                                                            class="bg-slate-50 border border-transparent hover:border-slate-300 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded px-2 py-1 w-full font-medium transition-all"
                                                        />
                                                    </td>
                                                    <td class="px-6 py-4">
                                                        <div
                                                            class="relative w-fit group/cat"
                                                        >
                                                            <span
                                                                class="px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-2 w-fit transition-all"
                                                                style="background-color: {getCategoryColor(
                                                                    tx.category,
                                                                )}20; color: {getCategoryColor(
                                                                    tx.category,
                                                                )}; border-color: {getCategoryColor(
                                                                    tx.category,
                                                                )}40"
                                                            >
                                                                <div
                                                                    class="w-1.5 h-1.5 rounded-full"
                                                                    style="background-color: {getCategoryColor(
                                                                        tx.category,
                                                                    )}"
                                                                ></div>
                                                                {tx.category}
                                                            </span>
                                                            <select
                                                                bind:value={
                                                                    tx.category
                                                                }
                                                                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-sm"
                                                                title="Modifier la catégorie"
                                                            >
                                                                {#each categories as c}
                                                                    <option
                                                                        value={c.name}
                                                                        >{c.name}</option
                                                                    >
                                                                {/each}
                                                            </select>
                                                            <!-- Edit hint icon on hover -->
                                                            <div
                                                                class="absolute -right-5 top-1/2 -translate-y-1/2 opacity-0 group-hover/cat:opacity-100 transition-opacity pointer-events-none text-slate-400"
                                                            >
                                                                <Pencil
                                                                    size={12}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td
                                                        class="px-6 py-4 text-right font-bold tabular-nums {tx.type ===
                                                        'income'
                                                            ? 'text-emerald-600'
                                                            : 'text-red-600'}"
                                                    >
                                                        <div
                                                            class="flex items-center justify-end gap-1"
                                                        >
                                                            <span
                                                                >{tx.type ===
                                                                "income"
                                                                    ? "+"
                                                                    : "-"}</span
                                                            >
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                bind:value={
                                                                    tx.amount
                                                                }
                                                                class="bg-slate-50 border border-transparent hover:border-slate-300 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded px-2 py-1 w-24 text-right font-bold transition-all {tx.type ===
                                                                'income'
                                                                    ? 'text-emerald-600'
                                                                    : 'text-red-600'}"
                                                            />
                                                            <span>€</span>
                                                        </div>
                                                    </td>
                                                    <td
                                                        class="px-6 py-4 text-center"
                                                    >
                                                        <input
                                                            type="text"
                                                            bind:value={
                                                                tx.statementNumber
                                                            }
                                                            class="bg-slate-50 border border-transparent hover:border-slate-300 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded px-2 py-1 w-full text-center text-xs text-slate-500 font-mono transition-all placeholder-slate-300"
                                                            placeholder="-"
                                                        />
                                                    </td>
                                                    <td
                                                        class="px-6 py-4 text-center"
                                                    >
                                                        <button
                                                            onclick={() =>
                                                                handleDeleteTransaction(
                                                                    tx.id,
                                                                )}
                                                            class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                            title="Supprimer"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            {/each}
                                        {/if}
                                        <!-- Fast Add Row -->
                                        <tr
                                            class="bg-blue-50/30 hover:bg-blue-50 transition-colors border-t-2 border-slate-100"
                                        >
                                            <td
                                                class="px-6 py-4 text-sm text-slate-600"
                                            >
                                                <div class="w-32">
                                                    <DatePicker
                                                        value={fastAdd.date}
                                                        onChange={(newDate) =>
                                                            (fastAdd.date =
                                                                newDate)}
                                                        variant="table"
                                                    />
                                                </div>
                                            </td>
                                            <td
                                                class="px-6 py-4 font-medium text-slate-800"
                                            >
                                                <input
                                                    type="text"
                                                    placeholder="Description..."
                                                    bind:value={
                                                        fastAdd.description
                                                    }
                                                    class="bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded px-2 py-1 w-full font-medium transition-all"
                                                    onkeydown={(e) =>
                                                        e.key === "Enter" &&
                                                        handleFastAdd()}
                                                />
                                            </td>
                                            <td class="px-6 py-4">
                                                <select
                                                    bind:value={
                                                        fastAdd.category
                                                    }
                                                    class="bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded px-2 py-1 w-full text-xs font-medium text-slate-600 cursor-pointer outline-none transition-all"
                                                >
                                                    {#each categories as c}
                                                        <option value={c.name}
                                                            >{c.name}</option
                                                        >
                                                    {/each}
                                                </select>
                                            </td>
                                            <td class="px-6 py-4 text-right">
                                                <div
                                                    class="flex items-center justify-end gap-1"
                                                >
                                                    <button
                                                        onclick={() =>
                                                            (fastAdd.type =
                                                                fastAdd.type ===
                                                                "income"
                                                                    ? "expense"
                                                                    : "income")}
                                                        class="font-bold w-4 text-center hover:bg-slate-200 rounded {fastAdd.type ===
                                                        'income'
                                                            ? 'text-emerald-600'
                                                            : 'text-red-600'}"
                                                    >
                                                        {fastAdd.type ===
                                                        "income"
                                                            ? "+"
                                                            : "-"}
                                                    </button>
                                                    <input
                                                        type="text"
                                                        inputmode="decimal"
                                                        placeholder="0.00"
                                                        bind:value={
                                                            fastAdd.amount
                                                        }
                                                        class="bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded px-2 py-1 w-24 text-right font-bold transition-all {fastAdd.type ===
                                                        'income'
                                                            ? 'text-emerald-600'
                                                            : 'text-red-600'}"
                                                        onkeydown={(e) =>
                                                            e.key === "Enter" &&
                                                            handleFastAdd()}
                                                    />
                                                    <span>€</span>
                                                </div>
                                            </td>
                                            <td class="px-6 py-4 text-center">
                                                <input
                                                    type="text"
                                                    bind:value={
                                                        fastAdd.statementNumber
                                                    }
                                                    class="bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded px-2 py-1 w-full text-center text-xs text-slate-500 font-mono transition-all placeholder-slate-300"
                                                    placeholder="-"
                                                    onkeydown={(e) =>
                                                        e.key === "Enter" &&
                                                        handleFastAdd()}
                                                />
                                            </td>
                                            <td class="px-6 py-4 text-center">
                                                <button
                                                    onclick={handleFastAdd}
                                                    class="p-2 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                    title="Ajouter"
                                                    disabled={!fastAdd.amount ||
                                                        !fastAdd.description}
                                                >
                                                    <Check size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        {/if}

                        {#if activeTab === "chart"}
                            <div class="p-8 h-[450px]">
                                <h3
                                    class="text-lg font-semibold text-slate-700 mb-6 text-center"
                                >
                                    Répartition des Dépenses
                                </h3>
                                <PieChart data={monthlyContext.pieData} />
                            </div>
                        {/if}

                        {#if activeTab === "evolution"}
                            <div class="p-8 h-[500px]">
                                <h3
                                    class="text-lg font-semibold text-slate-700 mb-4 text-center"
                                >
                                    Historique annuel global
                                </h3>
                                <BarChart data={barChartData} />
                            </div>
                        {/if}
                    </div>
                </div>
            {/if}
        </main>

        {#if isFormOpen}
            <TransactionForm
                onAdd={handleAddTransactions}
                onClose={() => (isFormOpen = false)}
                initialDate={currentDate}
                {categories}
            />
        {/if}

        {#if isCategoryManagerOpen}
            <CategoryManager
                {categories}
                onSave={handleSaveCategories}
                onClose={() => (isCategoryManagerOpen = false)}
            />
        {/if}
    </div>
{/if}

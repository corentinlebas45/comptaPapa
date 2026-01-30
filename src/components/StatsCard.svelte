<script lang="ts">
    import type { ComponentType } from "svelte";

    interface Props {
        title: string;
        amount: number;
        icon: ComponentType;
        colorClass: string;
        bgClass: string;
    }

    let { title, amount, icon: Icon, colorClass, bgClass }: Props = $props();
</script>

<div
    class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"
>
    <div>
        <p class="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <p class="text-2xl font-bold {colorClass}">
            {amount.toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
            })}
        </p>
    </div>
    <div class="p-3 rounded-xl {bgClass}">
        <Icon class="w-6 h-6 {colorClass}" />
    </div>
</div>

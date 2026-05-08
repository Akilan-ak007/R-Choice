"use client";

import { useTransition } from "react";

import { toast } from "sonner";

import { mergeAllSafeDuplicateMappings } from "@/app/actions/hierarchy";

export function BulkMergeSafeDuplicatesButton({
  disabled,
}: {
  disabled: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handleBulkMerge = () => {
    startTransition(async () => {
      const result = await mergeAllSafeDuplicateMappings();
      if (result?.error) {
        toast.error(result.error);
        return;
      }

      if (!result || result.mergedGroups === 0) {
        toast.message("No safe duplicate mappings were available to merge.");
        return;
      }

      toast.success(
        `Merged ${result.mergedGroups} duplicate scope group${result.mergedGroups === 1 ? "" : "s"} and removed ${result.deletedRows} extra row${result.deletedRows === 1 ? "" : "s"}.`
      );
    });
  };

  return (
    <button type="button" className="btn btn-primary" onClick={handleBulkMerge} disabled={disabled || isPending}>
      {isPending ? "Merging safe duplicates..." : "Repair all safe duplicates"}
    </button>
  );
}

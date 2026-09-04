import React from 'react';
import { Search } from 'lucide-react';

export function CommandEmptyState({ query }) {
  return (
    <div className="py-10 px-4 text-center select-none">
      <div className="w-10 h-10 rounded-full bg-[#F4F4F5] text-[#8B8B95] flex items-center justify-center mx-auto mb-2.5">
        <Search className="w-5 h-5 text-[#8B8B95]" />
      </div>
      <p className="text-[13.5px] font-semibold text-[#18181B]">
        No results found
      </p>
      <p className="text-[12px] text-[#71717A] mt-1 max-w-xs mx-auto">
        {query ? (
          <>No matches for &ldquo;{query}&rdquo;. Try searching for a task, person, department or page.</>
        ) : (
          'Try searching for a task, person, department or page.'
        )}
      </p>
    </div>
  );
}

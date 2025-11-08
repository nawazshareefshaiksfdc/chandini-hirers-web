export const uiFieldClass = (isInvalid: boolean, isEditing: boolean) => {
  const base = "w-full px-3 py-2 rounded-md bg-[#0c1323] border text-sm outline-none pr-10 focus:ring-1 ";
  const state = isInvalid
    ? "border-amber-400 text-amber-100 placeholder-amber-200 focus:ring-amber-400 bg-amber-500/5"
    : "border-gray-700 text-gray-100 placeholder-gray-400 focus:ring-[color:var(--color-primary)]";
  const lock = isEditing ? "" : " opacity-60 cursor-not-allowed";
  return base + state + lock;
};

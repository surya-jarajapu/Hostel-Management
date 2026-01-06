"use client";
export default function UserHeader({
  search,
  setSearch,
  fetchUsers,
}: UserHeaderProps) {

  return (
    <div className="mb-4">
      {/* TITLE */}
      <h4 className="text-lg sm:text-1xl font-semibold text-gray-900">
        Hostel Users
      </h4>

      {/* SEARCH */}
      <div className="mt-2 flex gap-2">
        <input
          className="
        flex-1 rounded-lg
        bg-white/60 backdrop-blur
        border border-gray-200
        px-4 py-2 text-sm
        focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Search name / mobile / room"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button
          onClick={() => fetchUsers()}
          className="
        rounded-lg
        bg-gradient-to-br from-[#0a84ff] to-[#5ac8fa]
        text-white px-4 py-2 text-sm
        shadow
      "
        >
          Search
        </button>
      </div>
    </div>
  );
}

{/* Add new navigation button */}
<button
  className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted w-full transition-colors"
  onClick={() => {
    // Add your button action here
    console.log('New button clicked');
  }}
>
  {/* You can replace this with your preferred icon */}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="mr-2"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
  New Button
</button> 
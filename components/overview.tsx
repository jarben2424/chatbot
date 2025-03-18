export function Overview() {
  return (
    <div className="absolute inset-0 flex items-center justify-center -mt-48">
      {/* Logo in top right - fixed position to ensure full visibility */}
      <div className="fixed top-4 right-6 z-30">
        <div className="w-32 h-auto">
          {/* Image will render on client side */}
          <img
            src="/images/Hang-Logo-Full-RichBlack.png"
            alt="Hang AI"
            width={128}
            height={38}
            className="w-full h-auto"
          />
        </div>
      </div>

      {/* Centered greeting - positioned to allow proper spacing with input box */}
      <div className="w-full max-w-xl px-6">
        <div className="flex flex-col gap-2 text-left">
          <h1 className="text-3xl md:text-4xl font-medium">
            Hello Brian,
          </h1>
          <p className="text-3xl md:text-4xl text-muted-foreground">
            What can I help you with?
          </p>
        </div>
      </div>
    </div>
  );
}

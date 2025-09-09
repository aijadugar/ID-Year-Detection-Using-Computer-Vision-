export default function Header() {
  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-3 text-balance">
            Real-Time ID Year Detection
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
          This project leverages advanced computer vision and AI technologies to automatically detect the current academic year of students by analyzing their band color of college ID cards in real-time. 
          The system enables lab assistant teachers to quickly identify which year students belong to during lab sessions, ensuring smooth management, efficient attendance monitoring, and better resource allocation.
          </p>

          {/* Feature badges */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            <span className="px-3 py-1 bg-muted text-foreground rounded-full text-sm font-medium">
              Real-time Detection
            </span>
            <span className="px-3 py-1 bg-muted text-foreground rounded-full text-sm font-medium">Audio Feedback</span>
            <span className="px-3 py-1 bg-muted text-foreground rounded-full text-sm font-medium">Mobile Friendly</span>
          </div>
        </div>
      </div>
    </header>
  )
}

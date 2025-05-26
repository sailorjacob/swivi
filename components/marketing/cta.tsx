export function CTA() {
  return (
    <section className="py-20 md:py-32 border-t border-black/5">
      <div className="max-width-wrapper section-padding">
        <div className="max-w-2xl">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-6">
            Let's Build Your Brand Intelligence Together
          </h2>
          <p className="text-muted-foreground mb-8">
            Every great brand deserves exceptional insights. 
            Start your journey with a personalized consultation.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <a
              href="https://calendly.com/bykevingeorge/30min?month=2025-05"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm font-normal bg-foreground text-background px-6 py-3 rounded-sm hover:bg-foreground/90 transition-colors"
            >
              Schedule Consultation
            </a>
          </div>
        </div>
      </div>
    </section>
  )
} 
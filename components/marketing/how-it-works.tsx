const steps = [
  {
    number: "01",
    title: "Define Your Focus",
    description: "Tell us about your brand, keywords, and channels to monitor.",
  },
  {
    number: "02",
    title: "Gather Intelligence",
    description: "We track and analyze mentions across all relevant media.",
  },
  {
    number: "03",
    title: "Act on Insights",
    description: "Use data-driven strategies to amplify your brand's reach.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-32 border-t border-black/5">
      <div className="max-width-wrapper section-padding">
        <div className="mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-4">
            Simple Process
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            From setup to insights in minutes, not weeks.
          </p>
        </div>

        <div className="space-y-16">
          {steps.map((step, index) => (
            <div key={step.number} className="flex gap-8 items-start">
              <div className="flex-shrink-0">
                <span className="text-3xl font-light text-muted-foreground">
                  {step.number}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-normal text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Simple CTA */}
        <div className="mt-20 pt-16 border-t border-black/5">
          <p className="text-sm text-muted-foreground mb-6">
            Ready to elevate your brand intelligence?
          </p>
          <a
            href="/signup"
            className="inline-flex items-center text-sm font-normal border-b border-foreground pb-1 hover:opacity-70 transition-opacity"
          >
            Get Started →
          </a>
        </div>
      </div>
    </section>
  )
} 
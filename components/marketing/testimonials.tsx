const testimonials = [
  {
    content: "Swivi transformed how we understand our media presence. The insights are invaluable.",
    author: "Sarah Chen",
    role: "Founder, Bloom Studios",
  },
  {
    content: "Finally, a partner who understands the nuances of brand intelligence.",
    author: "Marcus Johnson",
    role: "CEO, Forward Labs",
  },
]

export function Testimonials() {
  return (
    <section className="py-20 md:py-32 border-t border-black/5">
      <div className="max-width-wrapper section-padding">
        <div className="mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-4">
            Client Perspectives
          </h2>
        </div>

        <div className="space-y-12 max-w-3xl">
          {testimonials.map((testimonial, index) => (
            <blockquote
              key={index}
              className="border-l border-foreground/20 pl-6"
            >
              <p className="text-lg sm:text-xl font-light mb-4">
                "{testimonial.content}"
              </p>
              <footer className="text-sm text-muted-foreground">
                <span className="font-normal">{testimonial.author}</span>
                {" — "}
                {testimonial.role}
              </footer>
            </blockquote>
          ))}
        </div>

        {/* Simple metric */}
        <div className="mt-20 pt-16 border-t border-black/5">
          <p className="text-sm text-muted-foreground">
            Trusted by ambitious brands across 20+ industries
          </p>
        </div>
      </div>
    </section>
  )
} 
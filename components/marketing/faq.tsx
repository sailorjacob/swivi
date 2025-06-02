"use client"

import { motion } from "framer-motion"

const faqs = [
  {
    question: "How Do I Get Started?",
    answer: "Send content via Google Drive or Dropbox links; we build & manage your clipping community to boost your brand's reach.",
  },
  {
    question: "Do I Need To Do Anything Else?",
    answer: "No, just send us your content. We handle building, coaching, and managing your clipping community daily to scale your brand.",
  },
]

export function FAQ() {
  return (
    <section className="py-20 md:py-32 border-t border-black/5">
      <div className="max-width-wrapper section-padding">
        <div className="mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-4">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-12 max-w-3xl">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <h3 className="font-normal text-lg">{faq.question}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {faq.answer}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-16">
          <a
            href="https://calendly.com/bykevingeorge/30min?month=2025-05"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm font-normal bg-foreground text-background px-6 py-3 rounded-full hover:bg-foreground/90 transition-all duration-300"
          >
            Book a Call to Learn More
          </a>
        </div>
      </div>
    </section>
  )
} 
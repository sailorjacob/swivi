"use client"

import Script from "next/script"

const steps = [
  {
    number: "01",
    title: "Send Us Your Content",
    description: "We build a private creator community tailored for your brand. Just send us your content (ideally via Google Drive), and we'll handle everything, including recruiting creators from your audience and our extensive network.",
  },
  {
    number: "02",
    title: "Launch & Coach",
    description: "Once in your community, creators follow our streamlined launch process. We coach them to create high-quality content that matches your brand's vision, guidelines, and platform strategy.",
  },
  {
    number: "03",
    title: "Manage & Scale",
    description: "Our team manages your community daily, engaging creators, answering questions, and keeping momentum strong. Every post is manually reviewed for quality before approval, ensuring only the best content earns payouts. As your top creators thrive, your brand's reach and impact grow.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-32 border-t border-black/5 bg-background relative">
      {/* Load model-viewer library */}
      <Script 
        type="module" 
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"
        strategy="afterInteractive"
      />
      <div className="max-width-wrapper section-padding">
        <div className="mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            We build and manage your creator community to boost your brand's reach.
          </p>
        </div>

        {/* Desktop Layout: Text left, 3D Model right */}
        <div className="hidden md:flex gap-16 items-start">
          <div className="flex-1">
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
          </div>
          
          {/* 3D Model Viewer - Desktop Only */}
          <div className="w-[280px] lg:w-[320px] mt-12 -ml-8">
            <div 
              className="w-full h-[320px] lg:h-[380px]"
              dangerouslySetInnerHTML={{
                __html: `
                  <model-viewer
                    alt="3D Spacesuit Model"
                    src="https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb"
                    environment-image="https://modelviewer.dev/shared-assets/environments/aircraft_workshop_01_1k.hdr"
                    skybox-image="https://modelviewer.dev/shared-assets/environments/spruit_sunrise_1k_HDR.hdr"
                    exposure="0.8"
                    shadow-intensity="1"
                    shadow-softness="0.5"
                    camera-controls
                    touch-action="pan-y"
                    auto-rotate
                    rotation-per-second="20deg"
                    poster="https://modelviewer.dev/shared-assets/models/NeilArmstrong.webp"
                    style="width: 100%; height: 100%; --progress-bar-color: rgba(0,0,0,0.2);"
                  ></model-viewer>
                `
              }}
            />
          </div>
        </div>

        {/* Mobile Layout: Single column */}
        <div className="md:hidden space-y-16">
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
            Ready to scale your content reach?
          </p>
          <a
            href="https://calendly.com/bykevingeorge/30min?month=2025-05"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm font-normal border border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background px-6 py-3 rounded-full transition-all duration-300"
          >
            Book a Call →
          </a>
        </div>
      </div>
    </section>
  )
} 
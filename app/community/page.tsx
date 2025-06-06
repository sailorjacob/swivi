import { ClipperChat } from "@/components/community/clipper-chat"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export default function CommunityPage() {
  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col pt-16">
        <ClipperChat />
      </main>
      <Footer />
    </>
  )
} 
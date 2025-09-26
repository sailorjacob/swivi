import { MusicMarketplace } from "@/components/music-hub/music-marketplace"
import { ArtistSubmission } from "@/components/music-hub/artist-submission"
import { ClipperDashboard } from "@/components/music-hub/clipper-dashboard"
import { Header } from "../../components/layout/header"
import { Footer } from "../../components/layout/footer"
import { DarkThemeWrapper } from "../layout-wrapper"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Music, Upload, DollarSign } from "lucide-react"

export default function MusicHubPage() {
  return (
    <DarkThemeWrapper>
      <Header />
      <main className="flex min-h-screen flex-col pt-16">
        <section className="py-20 md:py-32 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="max-width-wrapper section-padding">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Music className="h-10 w-10 text-primary" />
                <h1 className="text-4xl md:text-5xl font-light">Music Clipping Hub</h1>
              </div>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                The revolutionary platform where clippers earn extra income and artists get viral exposure.
                Pay-per-view campaigns that benefit everyone.
              </p>
            </div>

            {/* Key Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-medium mb-2">For Clippers</h3>
                <p className="text-muted-foreground">
                  Earn $0.50-$5.00 per 1,000 views by using sponsored music in videos you're already making
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-medium mb-2">For Artists</h3>
                <p className="text-muted-foreground">
                  Get your music in thousands of viral videos. Pay only for verified views, starting at $1/1K
                </p>
              </div>
            </div>

            {/* Main Tabs */}
            <Tabs defaultValue="browse" className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
                <TabsTrigger value="browse">Browse Music</TabsTrigger>
                <TabsTrigger value="dashboard">My Dashboard</TabsTrigger>
                <TabsTrigger value="submit">Submit Music</TabsTrigger>
              </TabsList>

              <TabsContent value="browse" className="mt-8">
                <MusicMarketplace />
              </TabsContent>

              <TabsContent value="dashboard" className="mt-8">
                <ClipperDashboard />
              </TabsContent>

              <TabsContent value="submit" className="mt-8">
                <ArtistSubmission />
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>
      <Footer />
    </DarkThemeWrapper>
  )
} 
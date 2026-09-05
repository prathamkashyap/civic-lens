import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, MapPin, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CountUpNumber } from '../components/countUpNumber';

import Lottie from 'lottie-react';
import communityAnimation from '../assets/community-animation.json'; // Use your desired Lottie file

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-6 py-20 md:py-28">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -left-32 top-12 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
          </div>

          <div className="container relative z-10 mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <p className="mb-5 text-sm font-semibold uppercase tracking-[0.22em] text-primary">
                Civic intelligence platform
              </p>
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                Turn local reports into visible action.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">
                Civic Lens helps communities report public issues, understand hotspots, and prioritize the work that matters most.
              </p>

              <div className="mt-10 flex w-full max-w-md flex-col gap-4 sm:flex-row">
              <Button asChild className="h-12 flex-1 text-base" size="lg">
                <Link to="/report">
                  Report an Issue
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>

              <Button asChild variant="outline" className="h-12 flex-1 text-base" size="lg">
                <Link to="/dashboard">
                  View Dashboard
                </Link>
              </Button>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl">
              <div className="absolute -inset-5 rounded-[2rem] bg-primary/10 blur-2xl" />
              <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/85 p-4 shadow-2xl backdrop-blur-md">
                <div className="mb-4 flex items-center justify-between border-b border-border/70 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Live overview</p>
                    <p className="mt-1 text-lg font-semibold">Bhopal civic activity</p>
                  </div>
                  <span className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> Updated now
                  </span>
                </div>
                <div className="relative aspect-[1.15] overflow-hidden rounded-xl bg-[linear-gradient(135deg,hsl(var(--muted)),hsl(var(--background)))]">
                  <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(hsl(var(--border)/.5)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/.5)_1px,transparent_1px)] [background-size:28px_28px]" />
                  <div className="absolute left-[22%] top-[28%] h-28 w-28 rounded-full bg-amber-400/20 blur-xl" />
                  <div className="absolute right-[18%] top-[44%] h-32 w-32 rounded-full bg-primary/20 blur-xl" />
                  {[
                    'left-[25%] top-[34%] bg-amber-500',
                    'left-[48%] top-[50%] bg-red-500',
                    'right-[24%] top-[37%] bg-primary',
                    'right-[31%] bottom-[19%] bg-emerald-500',
                  ].map((marker) => (
                    <span key={marker} className={`absolute h-3 w-3 rounded-full shadow-lg ring-4 ring-background/50 ${marker}`} />
                  ))}
                  <div className="absolute bottom-4 left-4 rounded-lg border border-border/70 bg-card/90 px-3 py-2 shadow-lg backdrop-blur-sm">
                    <p className="text-xs text-muted-foreground">Active hotspot</p>
                    <p className="font-semibold">23 reports · High priority</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <MiniMetric value="1,284" label="Reports" />
                  <MiniMetric value="67%" label="Resolved" />
                  <MiniMetric value="18" label="Hotspots" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24 px-6 bg-muted/30">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">How It Works</h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                Civic Lens connects citizens directly with local authorities to quickly resolve issues
                in your neighborhood. Report, track, and see problems get fixed.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Camera className="h-10 w-10 text-urban-primary" />}
                title="Report Issues"
                description="Take a photo, choose a category, and provide your location. Reporting only takes seconds."
              />

              <FeatureCard
                icon={<MapPin className="h-10 w-10 text-urban-primary" />}
                title="Accurate Location"
                description="Our app automatically detects your location or lets you place a pin on the map for precise reporting."
              />

              <FeatureCard
                icon={<CheckCircle className="h-10 w-10 text-urban-primary" />}
                title="Status Updates"
                description="Get real-time notifications as your report moves from pending to completed."
              />
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="py-16 md:py-24 px-6 border-y border-border/60">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <StatCard value={<CountUpNumber target={15000} suffix="+" />} label="Issues Reported" />
              <StatCard value={<CountUpNumber target={85} suffix="%" />} label="Resolution Rate" />
              <StatCard value={<CountUpNumber target={48} suffix="hrs" />} label="Average Response Time" />
              <StatCard value={<CountUpNumber target={10000} suffix="+" />} label="Active Users" />
            </div>
          </div>
      </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 px-6">
          <div className="container mx-auto">
            <div className="relative overflow-hidden rounded-3xl bg-muted/30 p-8 md:p-12">

              {/* Lottie animation in the top-right */}
              <div className="absolute right-4 top-4 hidden h-40 w-40 opacity-80 md:block">
                <Lottie animationData={communityAnimation} loop className="h-full w-full" />
              </div>

              <div className="max-w-3xl">
                <h2 className="text-3xl font-bold">Join the Community</h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Be part of the solution.
                  <br />
                  Join thousands of active citizens
                  <br />
                  who are making their neighborhoods better places to live.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <Button asChild size="lg">
                    <Link to="/report">
                      Report Your First Issue
                    </Link>
                  </Button>

                  <Button asChild variant="outline" size="lg">
                    <Link to="/dashboard">
                      Explore the Dashboard
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

// Helper Components
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card className="border-none shadow-sm bg-card/80">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 p-3 rounded-full bg-muted/60">
            {icon}
          </div>
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatCardProps {
  value: React.ReactNode; // allow JSX (for CountUpNumber)
  label: string;
  className?: string;
}

function StatCard({ value, label, className = "" }: StatCardProps) {
  return (
    <div className={`text-center p-6 ${className}`}>
      <div className="text-4xl font-bold text-urban-primary shining">{value}</div>
      <div className="mt-2 text-muted-foreground">{label}</div>
    </div>
  );
}

function MiniMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg bg-muted/60 px-3 py-2">
      <p className="text-base font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default Index;

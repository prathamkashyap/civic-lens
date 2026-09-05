
import { ReportForm } from '@/components/ReportForm';
import MainLayout from '@/layouts/MainLayout';

const Report = () => {
  return (
    <MainLayout>
      <main className="mx-auto max-w-5xl">
        <div className="mb-8 max-w-2xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Community reporting
          </p>
          <h1 className="text-4xl font-bold tracking-tight">Report an issue</h1>
          <p className="mt-3 text-muted-foreground">
            Help improve your community by reporting waste, pothole, streetlight, drainage, or water supply issues.
          </p>
        </div>

        <div className="max-w-3xl">
          <ReportForm />
        </div>
      </main>
    </MainLayout>
  );
};

export default Report;

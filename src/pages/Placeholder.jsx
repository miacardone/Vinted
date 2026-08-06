import { PageHeader, Card, EmptyState } from '@/components/ui/Surface';

/** Temporary shell for screens still being built on this branch. */
export function Placeholder({ title, description, icon = 'inbox' }) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <Card>
        <EmptyState icon={icon} title="Screen in progress" hint="This screen is being built on the rebuild branch." />
      </Card>
    </>
  );
}

export default Placeholder;

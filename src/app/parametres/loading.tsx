import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'

export default function ParametresLoading() {
  return (
    <div className="flex-1 flex flex-col h-full">
      <PageHeader title="Paramètres" />
      <div className="flex-1 p-6">
        <div className="space-y-6">
          {/* Tabs skeleton */}
          <div className="space-y-2">
            <div className="h-10 bg-muted rounded-md animate-pulse"></div>
          </div>

          {/* Cards skeleton */}
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/3 animate-pulse mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4 animate-pulse"></div>
                    <div className="h-10 bg-muted rounded animate-pulse"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4 animate-pulse"></div>
                    <div className="h-10 bg-muted rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4 animate-pulse"></div>
                  <div className="h-20 bg-muted rounded animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
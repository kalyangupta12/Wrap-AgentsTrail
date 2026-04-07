import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, ArrowRight } from "lucide-react";

interface ApiCardProps {
  name: string;
  slug: string;
  description: string;
  pricePerCall: number;
  rateLimit: number;
}

export function ApiCard({
  name,
  slug,
  description,
  pricePerCall,
  rateLimit,
}: ApiCardProps) {
  return (
    <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{name}</CardTitle>
          <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium border border-blue-200">
            {rateLimit} req/min
          </span>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Endpoint</span>
            <code className="bg-secondary border px-2.5 py-1 rounded-md text-xs font-mono">
              /v1/{slug}
            </code>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Price</span>
            <span className="font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              ${pricePerCall} USDC
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full rounded-full group/btn" variant="outline">
          <Zap className="w-4 h-4 mr-2" />
          Try it
          <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all duration-200" />
        </Button>
      </CardFooter>
      {/* Hover border effect */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-200 rounded-xl transition-colors duration-300 pointer-events-none" />
    </Card>
  );
}

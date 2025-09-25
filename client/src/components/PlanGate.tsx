import React from "react";
import { useUserProfile } from "@/hooks/use-user-profile";
import { PlanConfig } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Crown, Zap } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PlanGateProps {
  children: React.ReactNode;
  requiredFeature?: keyof PlanConfig['features'];
  requiredPlan?: 'basic' | 'premium';
  buttonId?: string;
  action?: string;
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
  disabled?: boolean;
}

// Plan upgrade component
function PlanUpgrade({ requiredPlan, feature }: { requiredPlan?: string; feature?: string }) {
  const { planConfig, profile } = useUserProfile();
  
  const currentPlan = profile?.plan_type || 'demo';
  const planIcons = {
    demo: <Lock className="w-4 h-4" />,
    basic: <Zap className="w-4 h-4" />,
    premium: <Crown className="w-4 h-4" />
  };

  return (
    <div className="flex items-center justify-center p-4 rounded-lg bg-muted border-2 border-dashed">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          {planIcons[currentPlan]}
          <span className="text-sm font-medium">
            {feature ? `${feature} requires` : 'Upgrade required'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            Current: {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
          </Badge>
          {requiredPlan && (
            <>
              <span className="text-xs text-muted-foreground">→</span>
              <Badge variant="default" className="text-xs">
                Needs: {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)}
              </Badge>
            </>
          )}
        </div>
        <Button size="sm" variant="outline" className="text-xs">
          View Plans
        </Button>
      </div>
    </div>
  );
}

// Main plan gate component
export function PlanGate({
  children,
  requiredFeature,
  requiredPlan,
  buttonId,
  action,
  fallback,
  showUpgrade = true,
  disabled = false
}: PlanGateProps) {
  const { 
    hasFeature, 
    canPerformAction, 
    isButtonDisabled, 
    isReadOnly,
    profile,
    planConfig,
    isDemo,
    isBasic,
    isPremium
  } = useUserProfile();

  // If no profile is loaded, show children (assuming they'll handle loading states)
  if (!profile || !planConfig) {
    return <>{children}</>;
  }

  // Check feature requirement
  if (requiredFeature && !hasFeature(requiredFeature)) {
    if (!showUpgrade) return null;
    return (
      <>
        {fallback || (
          <PlanUpgrade 
            requiredPlan={requiredFeature === 'charts' || requiredFeature === 'strategy_playbook' || requiredFeature === 'ai_mentor' ? 'premium' : 'basic'} 
            feature={String(requiredFeature).replace('_', ' ')}
          />
        )}
      </>
    );
  }

  // Check plan requirement
  if (requiredPlan && 
      ((requiredPlan === 'basic' && isDemo) || 
       (requiredPlan === 'premium' && (isDemo || isBasic)))) {
    if (!showUpgrade) return null;
    return (
      <>
        {fallback || <PlanUpgrade requiredPlan={requiredPlan} />}
      </>
    );
  }

  // Check action permission
  if (action && !canPerformAction(action)) {
    if (isReadOnly && showUpgrade) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-not-allowed opacity-60">
              {children}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Demo mode - read only access</p>
          </TooltipContent>
        </Tooltip>
      );
    }
    if (!showUpgrade) return null;
    return <>{fallback || <PlanUpgrade />}</>;
  }

  // Check button-specific restrictions
  if (buttonId && isButtonDisabled(buttonId)) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-not-allowed opacity-60">
            {children}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>This feature is not available in your current plan</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Apply read-only restrictions to interactive elements
  if (isReadOnly && disabled !== false) {
    const childrenWithProps = React.Children.map(children, child => {
      if (React.isValidElement(child)) {
        // Disable buttons and form elements for demo users
        if (child.type === Button || 
            (child.props && typeof child.props.onClick === 'function') ||
            (child.props && child.props.type === 'button')) {
          return React.cloneElement(child as React.ReactElement<any>, {
            disabled: true,
            className: `${child.props.className || ''} cursor-not-allowed opacity-60`
          });
        }
      }
      return child;
    });
    
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div>{childrenWithProps}</div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Demo mode - read only access. Upgrade to interact with features.</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return <>{children}</>;
}

// Convenience components for specific plan restrictions
export function DemoGate({ children, fallback, showUpgrade = true }: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
  showUpgrade?: boolean; 
}) {
  return (
    <PlanGate 
      requiredPlan="basic" 
      fallback={fallback}
      showUpgrade={showUpgrade}
    >
      {children}
    </PlanGate>
  );
}

export function BasicGate({ children, fallback, showUpgrade = true }: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
  showUpgrade?: boolean; 
}) {
  return (
    <PlanGate 
      requiredPlan="premium" 
      fallback={fallback}
      showUpgrade={showUpgrade}
    >
      {children}
    </PlanGate>
  );
}

export function FeatureGate({ 
  feature, 
  children, 
  fallback, 
  showUpgrade = true 
}: { 
  feature: keyof PlanConfig['features']; 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
  showUpgrade?: boolean; 
}) {
  return (
    <PlanGate 
      requiredFeature={feature} 
      fallback={fallback}
      showUpgrade={showUpgrade}
    >
      {children}
    </PlanGate>
  );
}
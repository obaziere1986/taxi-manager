import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface UserAvatarProps {
  user: {
    name?: string | null
    avatarUrl?: string | null
  }
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function UserAvatar({ user, className, size = 'md' }: UserAvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-20 w-20'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-xl'
  }

  const initials = user.name
    ? `${user.name.split(' ')[0]?.[0] || ''}${user.name.split(' ')[1]?.[0] || ''}`.toUpperCase()
    : 'U'

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {user.avatarUrl && (
        <AvatarImage 
          src={user.avatarUrl} 
          alt={`Photo de ${user.name || 'utilisateur'}`}
          className="object-cover"
        />
      )}
      <AvatarFallback className={cn(
        "bg-muted border border-border text-foreground font-semibold",
        textSizeClasses[size]
      )}>
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
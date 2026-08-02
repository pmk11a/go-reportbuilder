
import * as LucideIcons from 'lucide-react'

interface LucideIconProps extends LucideIcons.LucideProps {
  name: string
}

const DynamicLucideIcon = ({ name, ...props }: LucideIconProps) => {
  // Convert kebab-case or other formats to PascalCase if needed
  const iconName = name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('') as keyof typeof LucideIcons

  const IconComponent = (LucideIcons[iconName] || LucideIcons.HelpCircle) as LucideIcons.LucideIcon

  return <IconComponent {...props} />
}

export default DynamicLucideIcon

export default function Logo({ size = 'md' }) {
  const sizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  }
  return (
    <div className={`font-bold ${sizes[size]} tracking-tight select-none`}>
      <span className="text-brand">Rep</span>
      <span className="text-gray-900">Shield</span>
      <span className="text-brand ml-1 font-light">AI</span>
    </div>
  )
}

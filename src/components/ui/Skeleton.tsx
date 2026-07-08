interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  className?: string
}

export const Skeleton = ({
  width = '100%',
  height = 16,
  borderRadius = 6,
  className = '',
}: SkeletonProps) => (
  <div
    className={`skeleton ${className}`}
    style={{ width, height, borderRadius }}
    aria-hidden="true"
  />
)

import React from 'react';
import styles from './styles.module.css';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple' | 'amber';
  color?: string;
  bgColor?: string;
  borderColor?: string;
  fullWidth?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  shape?: 'pill' | 'rectangle';
  className?: string;
  style?: React.CSSProperties;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  color,
  bgColor,
  borderColor,
  fullWidth = false,
  size = 'md',
  shape = 'rectangle',
  className = '',
  style = {},
}) => {
  const badgeClasses = [
    styles.badge,
    styles[`variant-${variant}`],
    styles[`size-${size}`],
    styles[`shape-${shape}`],
    fullWidth ? styles.fullWidth : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const customStyle: React.CSSProperties = {
    ...style,
    ...(color && { color }),
    ...(bgColor && { backgroundColor: bgColor }),
    ...(borderColor && { borderColor }),
  };

  return (
    <span className={badgeClasses} style={customStyle}>
      {children}
    </span>
  );
};

export default Badge;

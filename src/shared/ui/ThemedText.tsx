import React, { ReactNode } from 'react';
import { Text, TextProps } from 'react-native';
import { getColors, typography } from '@/shared/theme/tokens';
import { useTheme } from '@/shared/theme/ThemeProvider';

type ThemedTextProps = TextProps & {
  children: ReactNode;
};

export function ThemedText({ style, children, ...props }: ThemedTextProps) {
  const { resolvedTheme } = useTheme();
  const colors = getColors(resolvedTheme);
  
  return (
    <Text
      style={[{ color: colors.ink }, style]}
      {...props}
    >
      {children}
    </Text>
  );
}

export function DisplayText(props: ThemedTextProps) {
  return <ThemedText style={[typography.display, props.style]} {...props} />;
}

export function H1Text(props: ThemedTextProps) {
  return <ThemedText style={[typography.h1, props.style]} {...props} />;
}

export function H2Text(props: ThemedTextProps) {
  return <ThemedText style={[typography.h2, props.style]} {...props} />;
}

export function BodyText(props: ThemedTextProps) {
  return <ThemedText style={[typography.body, props.style]} {...props} />;
}

export function SmallText(props: ThemedTextProps) {
  return <ThemedText style={[typography.small, props.style]} {...props} />;
}

export function LabelText(props: ThemedTextProps) {
  return <ThemedText style={[typography.label, props.style]} {...props} />;
}

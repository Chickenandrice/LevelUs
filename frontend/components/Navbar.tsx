"use client";
import Link from "next/link";
import { useTheme } from "next-themes";
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Computer, Moon, Sun } from 'lucide-react';

export default function Navbar() {
  const { setTheme, theme } = useTheme();

  return (
    <nav className="w-full border-b border-border bg-card text-card-foreground">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-lg font-semibold">LevelUs</Link>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">Dashboard</Link>
        </div>

        <ToggleGroup defaultValue={['system']} onValueChange={(value) => setTheme(value[0] ?? 'system')}>
          <ToggleGroupItem value="light" >
            <Sun />
          </ToggleGroupItem>
          <ToggleGroupItem value="dark" >
            <Moon />
          </ToggleGroupItem>
          <ToggleGroupItem value="system">
            <Computer />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </nav>
  );
}

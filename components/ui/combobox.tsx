"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange?: (value: string) => void
  onInputChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
  required?: boolean
}

/**
 * Composant Combobox avec recherche incrémentielle non sensible à la casse
 * 
 * @param options - Liste des options disponibles
 * @param value - Valeur sélectionnée
 * @param onValueChange - Callback appelé lors du changement de valeur
 * @param placeholder - Texte affiché quand aucune valeur n'est sélectionnée
 * @param searchPlaceholder - Texte du placeholder du champ de recherche
 * @param emptyMessage - Message affiché quand aucune option ne correspond
 * @param className - Classes CSS supplémentaires
 * @param disabled - Désactive le composant
 * @param required - Indique que le champ est requis
 */
export function Combobox({
  options,
  value,
  onValueChange,
  onInputChange,
  placeholder = "Sélectionner...",
  searchPlaceholder = "Rechercher...",
  emptyMessage = "Aucun résultat trouvé.",
  className,
  disabled = false,
  required = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [width, setWidth] = React.useState<number | undefined>(undefined)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  const selectedOption = options.find((option) => option.value === value)

  React.useEffect(() => {
    if (triggerRef.current) {
      setWidth(triggerRef.current.offsetWidth)
    }
  }, [open])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-white",
            !selectedOption && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          {selectedOption ? selectedOption.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="p-0 z-[102]" 
        align="start"
        style={{ width: width ? `${width}px` : undefined }}
      >
        <Command>
          <CommandInput 
            placeholder={searchPlaceholder} 
            className="h-9"
            onValueChange={(searchValue) => {
              onInputChange?.(searchValue);
            }}
          />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.value} ${option.label}`}
                  onSelect={() => {
                    onValueChange?.(option.value === value ? "" : option.value)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}


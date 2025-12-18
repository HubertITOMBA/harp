"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"

export interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  selected?: string[]
  onChange?: (selected: string[]) => void
  // Support pour les props alternatives (value/onValueChange)
  value?: string[]
  onValueChange?: (selected: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
  maxCount?: number
}

/**
 * Composant MultiSelect pour sélectionner plusieurs valeurs dans une liste
 * 
 * @param options - Liste des options disponibles
 * @param selected - Tableau des valeurs sélectionnées
 * @param onChange - Fonction appelée lors du changement de sélection
 * @param placeholder - Texte affiché quand aucune sélection
 * @param searchPlaceholder - Texte du champ de recherche
 * @param emptyMessage - Message affiché quand aucun résultat
 * @param className - Classes CSS supplémentaires
 * @param disabled - Désactive le composant
 * @param maxCount - Nombre maximum d'éléments à afficher avant de montrer "+X autres"
 */
export function MultiSelect({
  options,
  selected,
  onChange,
  value,
  onValueChange,
  placeholder = "Sélectionner...",
  searchPlaceholder = "Rechercher...",
  emptyMessage = "Aucun résultat trouvé.",
  className,
  disabled = false,
  maxCount = 3,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  // Utiliser value/onValueChange si fournis, sinon selected/onChange
  const selectedValues = value || selected || []
  const handleChange = onValueChange || onChange || (() => {})

  const handleUnselect = (val: string) => {
    handleChange(selectedValues.filter((s) => s !== val))
  }

  const handleSelect = (val: string) => {
    if (selectedValues.includes(val)) {
      handleUnselect(val)
    } else {
      handleChange([...selectedValues, val])
    }
  }

  const selectedOptions = options.filter((option) =>
    selectedValues.includes(option.value)
  )

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchValue.toLowerCase())
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between min-h-10 h-auto",
            className
          )}
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selectedValues.length === 0 && (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            {selectedOptions.slice(0, maxCount).map((option) => (
              <Badge
                key={option.value}
                variant="secondary"
                className="mr-1 mb-1"
              >
                {option.label}
                <span
                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer inline-flex items-center justify-center"
                  role="button"
                  tabIndex={0}
                  aria-label={`Supprimer ${option.label}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      e.stopPropagation()
                      handleUnselect(option.value)
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleUnselect(option.value)
                  }}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </span>
              </Badge>
            ))}
            {selectedValues.length > maxCount && (
              <Badge variant="secondary" className="mr-1 mb-1">
                +{selectedValues.length - maxCount} autres
              </Badge>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" style={{ zIndex: 102 }} align="start">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedValues.includes(option.value)
                        ? "opacity-100"
                        : "opacity-0"
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


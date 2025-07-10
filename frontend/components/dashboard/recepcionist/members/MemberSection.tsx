"use client"
import React, { useState, useEffect } from "react"
import { TabsContent } from "@radix-ui/react-tabs"
import { MembersTab } from "./MembersTab"

type MembersSectionProps = {
  members: any[]
  searchTerm: string
  setSearchTerm: (value: string) => void
  onAddMember: () => void
  onEdit: (member: any) => void
  onDelete: (member: any) => void
}

export default function MembersSection({
  members,
  searchTerm,
  setSearchTerm,
  onAddMember,
  onEdit,
  onDelete,
}: MembersSectionProps) {
  const [localMembers, setLocalMembers] = useState(members)

  useEffect(() => {
    setLocalMembers(members)
  }, [members])

  return (
    <TabsContent value="members" className="space-y-4">
      <MembersTab
        members={localMembers}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onAddMember={() => onAddMember()}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </TabsContent>
  )
}

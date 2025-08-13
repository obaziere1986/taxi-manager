"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClientCombobox } from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  MapPin,
  Clock,
  User,
  Car,
  Edit,
  Trash2,
  Calendar,
  CalendarDays,
} from "lucide-react";
import { Course, CourseCategory, categorizeCourses } from "@/lib/course-utils";

interface Client {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
}

interface User {
  id: string;
  nom: string;
  prenom: string;
  role: string;
  vehicule?: string;
}

const statutLabels = {
  EN_ATTENTE: { label: "En attente", color: "bg-gray-500" },
  ASSIGNEE: { label: "Assignée", color: "bg-blue-500" },
  EN_COURS: { label: "En cours", color: "bg-orange-500" },
  TERMINEE: { label: "Terminée", color: "bg-green-500" },
  ANNULEE: { label: "Annulée", color: "bg-red-500" },
};

function CourseCard({
  course,
  onEdit,
  onDelete,
  onUpdateStatut,
}: {
  course: Course;
  onEdit: (course: Course) => void;
  onDelete: (id: string) => void;
  onUpdateStatut: (id: string, statut: string) => void;
}) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          {/* Trajet */}
          <div className="space-y-1">
            <div className="flex items-center text-sm font-medium">
              <MapPin className="mr-2 h-4 w-4 text-primary-500" />
              {course.origine}
            </div>
            <div className="flex items-center text-sm text-muted-foreground ml-6">
              → {course.destination}
            </div>
          </div>

          {/* Client & Chauffeur */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center">
              <User className="mr-2 h-3 w-3 text-grey-200" />
              {course.client.nom.toUpperCase()} {course.client.prenom}
            </div>
            {course.user ? (
              <div className="flex items-center">
                <Car className="mr-2 h-3 w-3 text-primary-200" />
                {course.user.nom.toUpperCase()} {course.user.prenom}
              </div>
            ) : (
              <span className="text-muted-foreground text-sm">Non assigné</span>
            )}
          </div>

          {/* Date & Prix */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center">
              <Clock className="mr-1 h-3 w-3" />
              {new Date(course.dateHeure).toLocaleString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>

        {/* Statut & Actions */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center">
            <div
              className={`w-2 h-2 rounded-full mr-2 ${
                statutLabels[course.statut].color
              }`}
            ></div>
            <Badge variant="outline" className="text-xs">
              {statutLabels[course.statut].label}
            </Badge>
          </div>

          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => onEdit(course)}>
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(course.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategorySection({
  title,
  categories,
  onEdit,
  onDelete,
  onUpdateStatut,
}: {
  title: string;
  categories: CourseCategory[];
  onEdit: (course: Course) => void;
  onDelete: (id: string) => void;
  onUpdateStatut: (id: string, statut: string) => void;
}) {
  // Par défaut, "aujourd'hui" est ouvert
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    new Set(["aujourd-hui"])
  );

  const toggleCategory = (categoryId: string) => {
    const newOpenCategories = new Set(openCategories);
    if (newOpenCategories.has(categoryId)) {
      newOpenCategories.delete(categoryId);
    } else {
      newOpenCategories.add(categoryId);
    }
    setOpenCategories(newOpenCategories);
  };

  const totalCourses = categories.reduce((sum, cat) => sum + cat.count, 0);

  if (totalCourses === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
          <Badge variant="outline">{totalCourses}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.map((category) => (
          <Collapsible
            key={category.id}
            open={openCategories.has(category.id)}
            onOpenChange={() => toggleCategory(category.id)}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between p-2 h-auto"
              >
                <div className="flex items-center gap-2">
                  {openCategories.has(category.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span className="font-medium">{category.title}</span>
                  <Badge variant="secondary">{category.count}</Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  {category.description}
                </span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {category.courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onUpdateStatut={onUpdateStatut}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </CardContent>
    </Card>
  );
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    origine: "",
    destination: "",
    dateHeure: "",
    clientId: "",
    userId: "",
    prix: "",
    notes: "",
    statut: "EN_ATTENTE",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [coursesRes, clientsRes, chauffeursRes] = await Promise.all([
        fetch("/api/courses"),
        fetch("/api/clients"),
        fetch("/api/users"),
      ]);

      const [coursesData, clientsData, chauffeursData] = await Promise.all([
        coursesRes.json(),
        clientsRes.json(),
        chauffeursRes.json(),
      ]);

      setCourses(coursesData);
      setClients(clientsData);
      // Filtrer uniquement les chauffeurs
      const chauffeurs = chauffeursData.filter(user => user.role === 'Chauffeur');
      setUsers(chauffeurs);
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCourse
        ? `/api/courses/${editingCourse.id}`
        : "/api/courses";
      const method = editingCourse ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        resetForm();
        fetchData();
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      origine: course.origine,
      destination: course.destination,
      dateHeure: new Date(course.dateHeure).toISOString().slice(0, 16),
      clientId: course.client?.id || "",
      userId: course.user?.id || "",
      prix: course.prix?.toString() || "",
      notes: course.notes || "",
      statut: course.statut,
    });
    setIsDialogOpen(true);
  };

  const updateStatut = async (courseId: string, newStatut: string) => {
    try {
      const course = courses.find((c) => c.id === courseId);
      if (!course) return;

      const response = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...course,
          statut: newStatut,
          dateHeure: course.dateHeure,
          clientId: course.client?.id,
          userId: course.user?.id || null,
        }),
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette course ?")) {
      try {
        const response = await fetch(`/api/courses/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          fetchData();
        }
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      origine: "",
      destination: "",
      dateHeure: "",
      clientId: "",
      userId: "",
      prix: "",
      notes: "",
      statut: "EN_ATTENTE",
    });
    setEditingCourse(null);
    setIsDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <PageHeader title="Courses" />
        <div className="flex-1 p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6 animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { aVenir, passees } = categorizeCourses(courses);

  return (
    <div className="flex-1 flex flex-col h-full">
      <PageHeader title="Courses">
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            if (!open) resetForm();
            setIsDialogOpen(open);
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle course
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingCourse ? "Modifier la course" : "Nouvelle course"}
              </DialogTitle>
              <DialogDescription>
                {editingCourse
                  ? "Modifiez les détails de la course."
                  : "Créer une nouvelle course pour vos clients."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="origine">Origine *</Label>
                  <Input
                    id="origine"
                    value={formData.origine}
                    onChange={(e) =>
                      setFormData({ ...formData, origine: e.target.value })
                    }
                    placeholder="Adresse de départ"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination *</Label>
                  <Input
                    id="destination"
                    value={formData.destination}
                    onChange={(e) =>
                      setFormData({ ...formData, destination: e.target.value })
                    }
                    placeholder="Adresse d'arrivée"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateHeure">Date et heure *</Label>
                <Input
                  id="dateHeure"
                  type="datetime-local"
                  value={formData.dateHeure}
                  onChange={(e) =>
                    setFormData({ ...formData, dateHeure: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientId">Client *</Label>
                <ClientCombobox
                  clients={clients}
                  value={formData.clientId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, clientId: value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userId">Chauffeur</Label>
                <Select 
                  value={formData.userId} 
                  onValueChange={(value) => setFormData({ ...formData, userId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Assigner un chauffeur (optionnel)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucun chauffeur</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.nom.toUpperCase()}, {user.prenom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prix">Prix (€)</Label>
                  <Input
                    id="prix"
                    type="number"
                    step="0.01"
                    value={formData.prix}
                    onChange={(e) =>
                      setFormData({ ...formData, prix: e.target.value })
                    }
                    placeholder="45.50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="statut">Statut</Label>
                  <Select
                    value={formData.statut}
                    onValueChange={(value) =>
                      setFormData({ ...formData, statut: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EN_ATTENTE">En attente</SelectItem>
                      <SelectItem value="ASSIGNEE">Assignée</SelectItem>
                      <SelectItem value="EN_COURS">En cours</SelectItem>
                      <SelectItem value="TERMINEE">Terminée</SelectItem>
                      <SelectItem value="ANNULEE">Annulée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Instructions spéciales..."
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingCourse ? "Modifier" : "Créer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex-1 p-6 space-y-6">
        {courses.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-medium mb-2">
                Aucune course enregistrée
              </h3>
              <p className="text-muted-foreground mb-4">
                Commencez par créer votre première course pour vos clients
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle course
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Courses à venir */}
            <CategorySection
              title="Courses à venir"
              categories={aVenir}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onUpdateStatut={updateStatut}
            />

            {/* Courses passées */}
            <CategorySection
              title="Courses passées"
              categories={passees}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onUpdateStatut={updateStatut}
            />
          </div>
        )}
      </div>
    </div>
  );
}

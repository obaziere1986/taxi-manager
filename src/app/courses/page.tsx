"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { getCourseStatusBadge, formatStatut } from '@/lib/badge-utils';
import { ProtectedComponent } from "@/components/auth/ProtectedComponent";
import { CourseModal } from "@/components/courses/CourseModal";
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

// Supprimé statutLabels - utilise maintenant getCourseStatusBadge de badge-utils

function CourseCard({
  course,
  onView,
  onEdit,
  onDelete,
  onUpdateStatut,
  session,
}: {
  course: Course;
  onView: (course: Course) => void;
  onEdit: (course: Course) => void;
  onDelete: (id: string) => void;
  onUpdateStatut: (id: string, statut: string) => void;
  session: { user: { role: string; id: string } } | null;
}) {
  return (
    <div className="border rounded-lg p-4 space-y-3 cursor-pointer hover:bg-muted/50" onClick={() => onView(course)}>
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
              {course.client ? 
                `${course.client.nom.toUpperCase()} ${course.client.prenom}` :
                'Client inconnu'
              }
            </div>
            {course.user ? (
              <div className="flex items-center">
                <Car className="mr-2 h-3 w-3 text-primary-200" />
                {course.user.nom ? 
                  `${course.user.nom.toUpperCase()} ${course.user.prenom}` :
                  'Chauffeur inconnu'
                }
              </div>
            ) : (
              <span className="text-muted-foreground text-sm">
                {course.notes && course.notes.includes('utilisateur supprimé') ? 
                  'Utilisateur supprimé' : 
                  'Non assigné'
                }
              </span>
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
            <Badge 
              variant={getCourseStatusBadge(course.statut).variant}
              className={getCourseStatusBadge(course.statut).className}
            >
              {formatStatut(course.statut)}
            </Badge>
          </div>

          <div className="flex gap-1">
            {/* Logique d'affichage du bouton d'édition - seul TERMINEE empêche la modification */}
            {(session?.user?.role !== 'Chauffeur' || 
             (course.user?.id === session.user.id && course.statut !== 'TERMINEE')) && (
              <ProtectedComponent permissions={["courses.update"]}>
                <Button variant="outline" size="sm" onClick={(e) => {
                  e.stopPropagation();
                  onEdit(course);
                }}>
                  <Edit className="h-3 w-3" />
                </Button>
              </ProtectedComponent>
            )}
            <ProtectedComponent permissions={["courses.delete"]}>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(course.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </ProtectedComponent>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategorySection({
  title,
  categories,
  onView,
  onEdit,
  onDelete,
  onUpdateStatut,
  session,
}: {
  title: string;
  categories: CourseCategory[];
  onView: (course: Course) => void;
  onEdit: (course: Course) => void;
  onDelete: (id: string) => void;
  onUpdateStatut: (id: string, statut: string) => void;
  session: { user: { role: string; id: string } } | null;
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
          <Badge variant="outline" className="text-xs font-medium px-2 py-1">{totalCourses}</Badge>
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
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onUpdateStatut={onUpdateStatut}
                  session={session}
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
  const { data: session } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseModal, setCourseModal] = useState<{
    isOpen: boolean;
    course?: Course | null;
    mode: 'create' | 'view' | 'edit';
  }>({ isOpen: false, course: null, mode: 'create' });

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      // Pour les chauffeurs, ne charger que leurs courses + non assignées
      const coursesUrl = session?.user?.role === 'Chauffeur' ? `/api/courses?userId=${session.user.id}` : '/api/courses';
      
      const [coursesRes, clientsRes, chauffeursRes] = await Promise.all([
        fetch(coursesUrl),
        fetch("/api/clients"),
        fetch("/api/users"),
      ]);

      const [coursesData, clientsData, chauffeursData] = await Promise.all([
        coursesRes.json(),
        clientsRes.json(),
        chauffeursRes.json(),
      ]);

      setCourses(Array.isArray(coursesData) ? coursesData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
      // Filtrer uniquement les chauffeurs
      const chauffeurs = Array.isArray(chauffeursData) ? chauffeursData.filter(user => user.role === 'Chauffeur') : [];
      setUsers(chauffeurs);
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    } finally {
      setLoading(false);
    }
  };


  const handleView = (course: Course) => {
    setCourseModal({ isOpen: true, course, mode: 'view' });
  };

  const handleEdit = (course: Course) => {
    console.log('handleEdit appelé', { course, userRole: session?.user?.role, userId: session?.user?.id });
    
    // Courses terminées ne peuvent pas être modifiées
    if (course.statut === 'TERMINEE') {
      return;
    }
    
    // Pour les chauffeurs, vérifier les permissions
    if (session?.user?.role === 'Chauffeur') {
      // Vérifier si c'est une course assignée au chauffeur et pas terminée
      if (course.user?.id === session.user.id && course.statut !== 'TERMINEE') {
        setCourseModal({ isOpen: true, course, mode: 'edit' });
      } else {
        console.log('Chauffeur - accès refusé:', { 
          courseUserId: course.user?.id, 
          sessionUserId: session.user.id, 
          statut: course.statut 
        });
      }
    } else {
      // Admin/Planner peuvent toujours modifier
      setCourseModal({ isOpen: true, course, mode: 'edit' });
    }
  };

  const handleCreateCourse = () => {
    setCourseModal({ isOpen: true, course: null, mode: 'create' });
  };

  const handleSaveCourse = async (courseData: Record<string, unknown>) => {
    try {
      const url = courseModal.course
        ? `/api/courses/${courseModal.course.id}`
        : "/api/courses";
      const method = courseModal.course ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(courseData),
      });

      if (response.ok) {
        await fetchData(); // Recharger les données
      } else {
        throw new Error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      throw error; // Relancer pour que le composant puisse gérer l'erreur
    }
  };

  const handleStatusUpdate = async (courseId: string, newStatus: string) => {
    try {
      const course = courses.find((c) => c.id === courseId);
      if (!course) throw new Error('Course non trouvée');

      const response = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          statut: newStatus
        }),
      });

      if (response.ok) {
        await fetchData();
      } else {
        throw new Error('Erreur lors de la mise à jour du statut');
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      throw error;
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        await fetchData();
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      throw error;
    }
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
        <ProtectedComponent permissions={["courses.create"]}>
          <Button onClick={handleCreateCourse}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle course
          </Button>
        </ProtectedComponent>
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
              <ProtectedComponent permissions={["courses.create"]}>
                <Button onClick={handleCreateCourse}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle course
                </Button>
              </ProtectedComponent>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Courses à venir */}
            <CategorySection
              title="Courses à venir"
              categories={aVenir}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDeleteCourse}
              onUpdateStatut={handleStatusUpdate}
              session={session}
            />

            {/* Courses passées */}
            <CategorySection
              title="Courses passées"
              categories={passees}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDeleteCourse}
              onUpdateStatut={handleStatusUpdate}
              session={session}
            />
          </div>
        )}
      </div>

      {/* Modal unifiée */}
      <CourseModal
        isOpen={courseModal.isOpen}
        onClose={() => setCourseModal({ isOpen: false, course: null, mode: 'create' })}
        course={courseModal.course}
        mode={courseModal.mode}
        clients={clients}
        users={users}
        onSave={handleSaveCourse}
        onStatusUpdate={handleStatusUpdate}
        onDelete={handleDeleteCourse}
      />
    </div>
  );
}

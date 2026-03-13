import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { firestore, auth } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import CalendarComponent from "../components/CalendarComponent";
import {
  FiCalendar,
  FiClock,
  FiMapPin,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiArrowLeft,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

function EventsCalendar() {
  const [user] = useAuthState(auth);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [categories, setCategories] = useState([
    { id: "academic", name: "Academic", color: "blue" },
    { id: "exam", name: "Exam", color: "red" },
    { id: "holiday", name: "Holiday", color: "green" },
    { id: "event", name: "General Event", color: "purple" },
  ]);
  const navigate = useNavigate();

  // Form refs
  const formRef = useRef(null);

  // Event form state
  const [formState, setFormState] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    location: "",
    category: "academic",
    isAllDay: false,
    isEditing: false,
    eventId: null,
  });

  // Check user role
  useEffect(() => {
    const checkUserRole = async () => {
      if (user) {
        // Check if user is admin
        const adminQuery = query(
          collection(firestore, "admins"),
          where("uid", "==", user.uid)
        );
        const adminSnapshot = await getDocs(adminQuery);
        setIsAdmin(!adminSnapshot.empty);

        // Check if user is teacher
        const teacherQuery = query(
          collection(firestore, "teachers"),
          where("uid", "==", user.uid)
        );
        const teacherSnapshot = await getDocs(teacherQuery);
        setIsTeacher(!teacherSnapshot.empty);
      }
    };

    checkUserRole();
  }, [user]);

  // Fetch events from Firestore
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const eventsQuery = query(
          collection(firestore, "events"),
          orderBy("startDate")
        );
        const eventsSnapshot = await getDocs(eventsQuery);
        const eventsList = eventsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEvents(eventsList);
      } catch (error) {
        console.error("Error fetching events:", error);
        toast.error("Failed to load events");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    try {
      const eventData = {
        title: formState.title,
        description: formState.description,
        startDate: formState.startDate,
        endDate: formState.endDate || formState.startDate,
        startTime: formState.isAllDay ? "00:00" : formState.startTime,
        endTime: formState.isAllDay ? "23:59" : formState.endTime,
        location: formState.location,
        category: formState.category,
        isAllDay: formState.isAllDay,
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
      };

      if (formState.isEditing && formState.eventId) {
        // Update existing event
        await updateDoc(doc(firestore, "events", formState.eventId), eventData);
        toast.success("Event updated successfully");
      } else {
        // Add new event
        await addDoc(collection(firestore, "events"), eventData);
        toast.success("Event added successfully");
      }

      // Refresh events list
      const eventsQuery = query(
        collection(firestore, "events"),
        orderBy("startDate")
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      const eventsList = eventsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEvents(eventsList);

      // Reset form
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error("Failed to save event");
    }
  };

  const handleDelete = async (eventId) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      await deleteDoc(doc(firestore, "events", eventId));
      setEvents(events.filter((event) => event.id !== eventId));
      toast.success("Event deleted successfully");
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
    }
  };

  const editEvent = (event) => {
    setFormState({
      title: event.title,
      description: event.description || "",
      startDate: event.startDate,
      endDate: event.endDate || event.startDate,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location || "",
      category: event.category,
      isAllDay: event.isAllDay,
      isEditing: true,
      eventId: event.id,
    });
    setShowForm(true);

    // Scroll to form
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const resetForm = () => {
    setFormState({
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
      location: "",
      category: "academic",
      isAllDay: false,
      isEditing: false,
      eventId: null,
    });
  };

  const handleToggleForm = () => {
    if (showForm) {
      resetForm();
    }
    setShowForm(!showForm);

    // Scroll to form when opening
    if (!showForm) {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  const getCategoryColor = (categoryId) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.color : "gray";
  };

  const getCategoryBgClass = (categoryId) => {
    const colorMap = {
      blue: "bg-blue-100 text-blue-800 border-blue-200",
      red: "bg-red-100 text-red-800 border-red-200",
      green: "bg-green-100 text-green-800 border-green-200",
      purple: "bg-purple-100 text-purple-800 border-purple-200",
      gray: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colorMap[getCategoryColor(categoryId)];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pt-10 pb-10">
      <button
        onClick={() => navigate("/calendars")}
        className="flex items-center ml-8 my-4 text-indigo-600 hover:text-indigo-800 transition-colors"
      >
        <FiArrowLeft className="mr-2" />
        Back to Calendars
      </button>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Events Calendar</h1>

          {(isTeacher || isAdmin) && (
            <button
              onClick={handleToggleForm}
              className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition"
            >
              {showForm ? (
                <>Cancel</>
              ) : (
                <>
                  <FiPlus className="mr-2" />
                  Add Event
                </>
              )}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Calendar */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <CalendarComponent events={events} />
            </motion.div>
          </div>

          {/* Right Column - Event Form or List */}
          <div>
            {/* Event Form (conditionally rendered) */}
            {showForm && (
              <motion.div
                ref={formRef}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-6 rounded-xl shadow-md mb-6"
              >
                <h2 className="text-xl font-semibold mb-4">
                  {formState.isEditing ? "Edit Event" : "Add New Event"}
                </h2>
                <form onSubmit={handleFormSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 mb-2">Title*</label>
                      <input
                        type="text"
                        className="w-full border rounded py-2 px-3 text-gray-700"
                        value={formState.title}
                        onChange={(e) =>
                          setFormState({ ...formState, title: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        className="w-full border rounded py-2 px-3 text-gray-700"
                        value={formState.description}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            description: e.target.value,
                          })
                        }
                        rows="3"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-700 mb-2">
                          Start Date*
                        </label>
                        <input
                          type="date"
                          className="w-full border rounded py-2 px-3 text-gray-700"
                          value={formState.startDate}
                          onChange={(e) =>
                            setFormState({
                              ...formState,
                              startDate: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          className="w-full border rounded py-2 px-3 text-gray-700"
                          value={formState.endDate}
                          onChange={(e) =>
                            setFormState({
                              ...formState,
                              endDate: e.target.value,
                            })
                          }
                          min={formState.startDate}
                        />
                      </div>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isAllDay"
                        checked={formState.isAllDay}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            isAllDay: e.target.checked,
                          })
                        }
                        className="mr-2"
                      />
                      <label htmlFor="isAllDay" className="text-gray-700">
                        All-day event
                      </label>
                    </div>

                    {!formState.isAllDay && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-700 mb-2">
                            Start Time
                          </label>
                          <input
                            type="time"
                            className="w-full border rounded py-2 px-3 text-gray-700"
                            value={formState.startTime}
                            onChange={(e) =>
                              setFormState({
                                ...formState,
                                startTime: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <label className="block text-gray-700 mb-2">
                            End Time
                          </label>
                          <input
                            type="time"
                            className="w-full border rounded py-2 px-3 text-gray-700"
                            value={formState.endTime}
                            onChange={(e) =>
                              setFormState({
                                ...formState,
                                endTime: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-gray-700 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        className="w-full border rounded py-2 px-3 text-gray-700"
                        value={formState.location}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            location: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        className="w-full border rounded py-2 px-3 text-gray-700"
                        value={formState.category}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            category: e.target.value,
                          })
                        }
                      >
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                    >
                      {formState.isEditing ? "Update Event" : "Add Event"}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Upcoming Events List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white p-6 rounded-xl shadow-md"
            >
              <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>

              {loading ? (
                <div className="text-center py-4">
                  <p>Loading events...</p>
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-4">
                  <p>No upcoming events found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {events
                    .filter((event) => new Date(event.startDate) >= new Date())
                    .sort(
                      (a, b) => new Date(a.startDate) - new Date(b.startDate)
                    )
                    .slice(0, 5)
                    .map((event) => (
                      <div
                        key={event.id}
                        className="border-l-4 px-4 py-3 rounded-r-lg hover:bg-gray-50 transition-colors"
                        style={{
                          borderLeftColor:
                            event.category === "academic"
                              ? "#3b82f6"
                              : event.category === "exam"
                              ? "#ef4444"
                              : event.category === "holiday"
                              ? "#10b981"
                              : "#8b5cf6",
                        }}
                      >
                        <div className="flex justify-between">
                          <h3 className="font-medium text-gray-800">
                            {event.title}
                          </h3>
                          <span
                            className={`text-xs px-2 py-1 rounded-full border ${getCategoryBgClass(
                              event.category
                            )}`}
                          >
                            {
                              categories.find(
                                (cat) => cat.id === event.category
                              )?.name
                            }
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <FiCalendar className="mr-1" />
                          <span>
                            {new Date(event.startDate).toLocaleDateString()}
                            {event.startDate !== event.endDate &&
                              ` - ${new Date(
                                event.endDate
                              ).toLocaleDateString()}`}
                          </span>
                        </div>
                        {!event.isAllDay && (
                          <div className="flex items-center text-sm text-gray-600 mt-1">
                            <FiClock className="mr-1" />
                            <span>
                              {event.startTime} - {event.endTime}
                            </span>
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center text-sm text-gray-600 mt-1">
                            <FiMapPin className="mr-1" />
                            <span>{event.location}</span>
                          </div>
                        )}

                        {(isTeacher || isAdmin) && (
                          <div className="flex mt-2 space-x-2">
                            <button
                              onClick={() => editEvent(event)}
                              className="text-xs flex items-center text-blue-600 hover:text-blue-800"
                            >
                              <FiEdit2 className="mr-1" /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(event.id)}
                              className="text-xs flex items-center text-red-600 hover:text-red-800"
                            >
                              <FiTrash2 className="mr-1" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                  <div className="text-center pt-2">
                    <a
                      href="#all-events"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View all events →
                    </a>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* All Events Section */}
        <div id="all-events" className="mt-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">All Events</h2>

          {loading ? (
            <div className="text-center py-4">
              <p>Loading events...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-4">
              <p>No events found.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      {(isTeacher || isAdmin) && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {events
                      .sort(
                        (a, b) => new Date(a.startDate) - new Date(b.startDate)
                      )
                      .map((event) => (
                        <tr key={event.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {event.title}
                            </div>
                            {event.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {event.description}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(event.startDate).toLocaleDateString()}
                            {event.startDate !== event.endDate && (
                              <span>
                                {" "}
                                - {new Date(event.endDate).toLocaleDateString()}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {event.isAllDay ? (
                              "All day"
                            ) : (
                              <>
                                {event.startTime} - {event.endTime}
                              </>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {event.location || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryBgClass(
                                event.category
                              )}`}
                            >
                              {
                                categories.find(
                                  (cat) => cat.id === event.category
                                )?.name
                              }
                            </span>
                          </td>
                          {(isTeacher || isAdmin) && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button
                                onClick={() => editEvent(event)}
                                className="text-blue-600 hover:text-blue-900 mr-3"
                              >
                                <FiEdit2 />
                              </button>
                              <button
                                onClick={() => handleDelete(event.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <FiTrash2 />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EventsCalendar;

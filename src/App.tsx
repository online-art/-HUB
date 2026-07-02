import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import CalendarView from "./components/CalendarView";
import BookingForm from "./components/BookingForm";
import AdminDashboard from "./components/AdminDashboard";
import Regulations from "./components/Regulations";
import ContactUs from "./components/ContactUs";
import AuthModal from "./components/AuthModal";
import { Booking, Room, ROOMS } from "./types";

// Firebase imports
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, setDoc, query, orderBy } from "firebase/firestore";
import { db, auth } from "./firebase";
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

// Lucide Icons
import { Sparkles, Calendar, BookOpen, Clock, ShieldAlert } from "lucide-react";

// Import generated image
import educationHubImg from "./assets/images/education_hub_1782874322133.jpg";

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>("home");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>("");
  const [subAdmins, setSubAdmins] = useState<string[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  // Listen for Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setUserEmail(user.email.toLowerCase());
      } else {
        setUserEmail(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Firestore Error Handling utilities
  enum OperationType {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    LIST = 'list',
    GET = 'get',
    WRITE = 'write',
  }

  interface FirestoreErrorInfo {
    error: string;
    operationType: OperationType;
    path: string | null;
    authInfo: {
      userId?: string | null;
      email?: string | null;
      emailVerified?: boolean | null;
      isAnonymous?: boolean | null;
      tenantId?: string | null;
      providerInfo?: {
        providerId?: string | null;
        email?: string | null;
      }[];
    }
  }

  function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
        tenantId: auth.currentUser?.tenantId,
        providerInfo: auth.currentUser?.providerData?.map(provider => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || []
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  }

  // Listen for real-time Firestore bookings
  useEffect(() => {
    const pathForOnSnapshot = 'bookings';
    const q = query(collection(db, pathForOnSnapshot), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedBookings: Booking[] = [];
      snapshot.forEach((docSnap) => {
        fetchedBookings.push({
          id: docSnap.id,
          ...docSnap.data()
        } as Booking);
      });

      setBookings(fetchedBookings);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, pathForOnSnapshot);
    });

    return () => unsubscribe();
  }, []);

  // Listen for real-time Firestore sub-admins
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "sub_admins"), (snapshot) => {
      const emails: string[] = [];
      snapshot.forEach((docSnap) => {
        emails.push(docSnap.id.toLowerCase());
      });
      setSubAdmins(emails);
    }, (error) => {
      console.error("Firestore sub_admins listening error: ", error);
    });
    return () => unsubscribe();
  }, []);

  // Listen for real-time Firestore rooms
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "rooms"), (snapshot) => {
      const fetchedRooms: Room[] = [];
      snapshot.forEach((docSnap) => {
        fetchedRooms.push({
          id: docSnap.id,
          ...docSnap.data()
        } as Room);
      });
      
      if (fetchedRooms.length > 0) {
        setRooms(fetchedRooms);
      } else {
        // Seed database with default rooms from ROOMS config
        ROOMS.forEach(async (room) => {
          await setDoc(doc(db, "rooms", room.id), {
            name: room.name,
            capacity: room.capacity,
            equipment: room.equipment,
            color: room.color,
            textColor: room.textColor,
            borderColor: room.borderColor,
            bgLight: room.bgLight,
            icon: room.icon
          });
        });
      }
    }, (error) => {
      console.error("Firestore rooms listening error: ", error);
    });
    return () => unsubscribe();
  }, []);

  // One-time automatic purge of development sample/mock bookings for the Super Admin
  useEffect(() => {
    if (userEmail?.toLowerCase() === "aek-apisit@pwk.ac.th" && bookings.length > 0) {
      const hasPurged = localStorage.getItem("hasPurgedSampleData_v3");
      if (!hasPurged) {
        console.log("Super Admin logged in. Performing one-time purge of sample/mock data...");
        const promises = bookings.map(b => deleteDoc(doc(db, "bookings", b.id)));
        Promise.all(promises)
          .then(() => {
            localStorage.setItem("hasPurgedSampleData_v3", "true");
            alert("ระบบได้ทำการล้างข้อมูลการจองตัวอย่างช่วงพัฒนาออกให้โดยอัตโนมัติแล้ว! ตอนนี้ระบบว่างเปล่าพร้อมใช้งานจริง");
          })
          .catch((err) => {
            console.error("Error during automatic purge:", err);
          });
      }
    }
  }, [userEmail, bookings]);

  // Google Login handling
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  // Logout handling
  const handleLogout = async () => {
    await signOut(auth);
    setUserEmail(null);
    setCurrentTab("home");
  };

  // Helper to check for booking conflicts
  const getConflictingBooking = (
    room: string,
    startDate: string,
    endDate: string,
    startTime: string,
    endTime: string,
    excludeId?: string,
    onlyApproved: boolean = false
  ): Booking | null => {
    const newStart = new Date(`${startDate}T${startTime}`).getTime();
    const newEnd = new Date(`${endDate}T${endTime}`).getTime();

    if (isNaN(newStart) || isNaN(newEnd)) return null;

    for (const b of bookings) {
      if (b.room !== room) continue;
      if (excludeId && b.id === excludeId) continue;
      if (b.status === "rejected") continue;
      if (onlyApproved && b.status !== "approved") continue;

      const existingStart = new Date(`${b.startDate}T${b.startTime}`).getTime();
      const existingEnd = new Date(`${b.endDate}T${b.endTime}`).getTime();

      if (isNaN(existingStart) || isNaN(existingEnd)) continue;

      // Overlap: newStart < existingEnd && newEnd > existingStart
      if (newStart < existingEnd && newEnd > existingStart) {
        return b;
      }
    }
    return null;
  };

  // Submit new booking request
  const handleSubmitBooking = async (bookingData: Omit<Booking, "id" | "status" | "userEmail" | "createdAt">): Promise<boolean> => {
    const path = "bookings";
    try {
      // Check for overlapping bookings
      const conflict = getConflictingBooking(
        bookingData.room,
        bookingData.startDate,
        bookingData.endDate,
        bookingData.startTime,
        bookingData.endTime
      );

      if (conflict) {
        const conflictStatus = conflict.status === "approved" ? "ได้รับการอนุมัติแล้ว" : "อยู่ระหว่างการพิจารณา";
        const conflictDateText = conflict.startDate === conflict.endDate 
          ? conflict.startDate 
          : `${conflict.startDate} ถึง ${conflict.endDate}`;
        
        throw new Error(
          `ไม่สามารถจองได้! เนื่องจากมีคิวจองที่ซ้ำซ้อนในช่วงเวลาดังกล่าว\n\n` +
          `• สถานะคิวเดิม: ${conflictStatus}\n` +
          `• ผู้จอง: คุณ ${conflict.fullName} (${conflict.department})\n` +
          `• วันที่จอง: ${conflictDateText}\n` +
          `• เวลาที่จอง: ${conflict.startTime} - ${conflict.endTime} น.\n` +
          `• จุดประสงค์: ${conflict.purpose}`
        );
      }

      const newBooking = {
        ...bookingData,
        status: "pending" as const,
        userEmail: userEmail || "guest@pwk.ac.th",
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, path), newBooking);

      // Trigger Line Notification via proxy API
      try {
        await fetch("/api/notify-line", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            fullName: bookingData.fullName,
            department: bookingData.department,
            room: bookingData.room,
            startDate: bookingData.startDate,
            endDate: bookingData.endDate,
            startTime: bookingData.startTime,
            endTime: bookingData.endTime,
            purpose: bookingData.purpose,
            attendeesCount: bookingData.attendeesCount
          })
        });
      } catch (lineError) {
        console.error("Failed to send LINE notification:", lineError);
      }

      return true;
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("ไม่สามารถจองได้!")) {
        throw err;
      }
      handleFirestoreError(err, OperationType.WRITE, path);
      return false;
    }
  };

  // Approve booking (Admin)
  const handleApproveBooking = async (id: string) => {
    const path = `bookings/${id}`;
    try {
      const bookingToApprove = bookings.find(b => b.id === id);
      if (bookingToApprove) {
        const conflict = getConflictingBooking(
          bookingToApprove.room,
          bookingToApprove.startDate,
          bookingToApprove.endDate,
          bookingToApprove.startTime,
          bookingToApprove.endTime,
          id,
          true // Only check against already approved bookings
        );

        if (conflict) {
          alert(
            `ไม่สามารถอนุมัติได้! เนื่องจากมีรายการจองที่ได้รับอนุมัติแล้วซ้ำซ้อนกันในช่วงเวลานี้\n\n` +
            `• รายการที่ชน: โดยคุณ ${conflict.fullName} สำหรับ "${conflict.purpose}"\n` +
            `• เวลาที่ชน: ${conflict.startTime} - ${conflict.endTime} น.`
          );
          return;
        }
      }

      const docRef = doc(db, "bookings", id);
      await updateDoc(docRef, { status: "approved" });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  // Reject booking (Admin)
  const handleRejectBooking = async (id: string) => {
    const path = `bookings/${id}`;
    try {
      const docRef = doc(db, "bookings", id);
      await updateDoc(docRef, { status: "rejected" });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  // Delete booking (Admin/User)
  const handleDeleteBooking = async (id: string) => {
    const path = `bookings/${id}`;
    try {
      const docRef = doc(db, "bookings", id);
      await deleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  // Update booking (Admin)
  const handleUpdateBooking = async (id: string, updatedFields: Omit<Booking, "id" | "createdAt" | "userEmail">): Promise<boolean> => {
    const path = `bookings/${id}`;
    try {
      const originalBooking = bookings.find(b => b.id === id);
      if (!originalBooking) throw new Error("ไม่พบรายการจองที่ต้องการแก้ไข");

      // Check for overlapping bookings
      const conflict = getConflictingBooking(
        updatedFields.room,
        updatedFields.startDate,
        updatedFields.endDate,
        updatedFields.startTime,
        updatedFields.endTime,
        id,
        true // only check against already approved bookings
      );

      if (conflict) {
        const conflictStatus = conflict.status === "approved" ? "ได้รับการอนุมัติแล้ว" : "อยู่ระหว่างการพิจารณา";
        const conflictDateText = conflict.startDate === conflict.endDate 
          ? conflict.startDate 
          : `${conflict.startDate} ถึง ${conflict.endDate}`;
        
        throw new Error(
          `ไม่สามารถแก้ไขได้! เนื่องจากมีคิวจองที่ได้รับอนุมัติแล้วซ้ำซ้อนในช่วงเวลาดังกล่าว\n\n` +
          `• ผู้จอง: คุณ ${conflict.fullName} (${conflict.department})\n` +
          `• วันที่จอง: ${conflictDateText}\n` +
          `• เวลาที่จอง: ${conflict.startTime} - ${conflict.endTime} น.`
        );
      }

      const docRef = doc(db, "bookings", id);
      const updatedBooking = {
        fullName: updatedFields.fullName,
        department: updatedFields.department,
        startDate: updatedFields.startDate,
        endDate: updatedFields.endDate,
        startTime: updatedFields.startTime,
        endTime: updatedFields.endTime,
        room: updatedFields.room,
        purpose: updatedFields.purpose,
        attendeesCount: Number(updatedFields.attendeesCount),
        status: updatedFields.status,
        userEmail: originalBooking.userEmail,
        createdAt: originalBooking.createdAt
      };

      await updateDoc(docRef, updatedBooking);
      return true;
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("ไม่สามารถแก้ไขได้!")) {
        throw err;
      }
      handleFirestoreError(err, OperationType.UPDATE, path);
      return false;
    }
  };

  // Purge all bookings (Admin/Super Admin)
  const handlePurgeAllBookings = async () => {
    try {
      const promises = bookings.map(b => deleteDoc(doc(db, "bookings", b.id)));
      await Promise.all(promises);
      alert("ล้างข้อมูลการจองทั้งหมดเสร็จสิ้น!");
    } catch (err) {
      console.error("Error purging all bookings:", err);
      alert("เกิดข้อผิดพลาดในการล้างข้อมูลการจอง");
    }
  };

  // Sub Admin Management
  const handleAddSubAdmin = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;
    try {
      await setDoc(doc(db, "sub_admins", cleanEmail), {
        email: cleanEmail,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error adding sub-admin:", err);
      alert("ไม่สามารถเพิ่มแอดมินรองได้: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleRemoveSubAdmin = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;
    try {
      await deleteDoc(doc(db, "sub_admins", cleanEmail));
    } catch (err) {
      console.error("Error removing sub-admin:", err);
      alert("ไม่สามารถลบแอดมินรองได้: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Room Management Actions
  const handleAddRoom = async (roomData: Omit<Room, "id">) => {
    try {
      const newRoomRef = doc(collection(db, "rooms"));
      await setDoc(newRoomRef, {
        ...roomData
      });
    } catch (err) {
      console.error("Error adding room:", err);
      throw new Error("ไม่สามารถเพิ่มห้องประชุมได้: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleUpdateRoom = async (id: string, roomData: Omit<Room, "id">) => {
    try {
      await updateDoc(doc(db, "rooms", id), {
        ...roomData
      });
    } catch (err) {
      console.error("Error updating room:", err);
      throw new Error("ไม่สามารถแก้ไขข้อมูลห้องประชุมได้: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleDeleteRoom = async (id: string) => {
    try {
      await deleteDoc(doc(db, "rooms", id));
    } catch (err) {
      console.error("Error deleting room:", err);
      alert("ไม่สามารถลบห้องประชุมได้: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Navigate & Scroll utils
  const scrollToSection = (id: string) => {
    setCurrentTab("home");
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  // Determine permissions
  const isSuperAdmin = userEmail?.toLowerCase() === "aek-apisit@pwk.ac.th";
  const isSubAdmin = subAdmins.includes(userEmail?.toLowerCase() || "");
  const isAdmin = isSuperAdmin || isSubAdmin;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col justify-between selection:bg-brand-primary/10 selection:text-brand-primary">
      {/* Navigation bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        userEmail={userEmail}
        onLoginClick={() => setIsAuthModalOpen(true)}
        onLogoutClick={handleLogout}
        isAdmin={isAdmin}
      />

      {/* Main Container */}
      <main className="grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-12">
        {currentTab === "home" && (
          <div className="space-y-16 animate-in fade-in duration-300">
            {/* HERO SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Text column */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-100/50">
                  <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                  <span className="text-xs font-bold text-brand-primary tracking-wider uppercase">
                    Digital Learning Space
                  </span>
                </div>

                <div className="space-y-3">
                  <h2 className="text-4xl sm:text-5xl font-extrabold text-brand-dark tracking-tight font-sans leading-none">
                    ระบบจองใช้บริการ <span className="text-brand-primary">HUB</span>
                  </h2>
                  <p className="text-base sm:text-lg text-brand-neutral leading-relaxed max-w-2xl">
                    โรงเรียนประสาทวิทยาคาร มุ่งเน้นการบริการใช้เทคโนโลยีเพื่อการเรียนรู้อย่างสร้างสรรค์ 
                    จัดสรรพื้นที่สำหรับการทำงานกลุ่ม การศึกษาค้นคว้า และสร้างสรรค์นวัตกรรมใหม่ๆ ร่วมกันในศตวรรษที่ 21
                  </p>
                </div>

                {/* Hero CTA buttons */}
                <div className="flex flex-wrap gap-4 pt-2">
                  <button
                    onClick={() => scrollToSection("booking-form-section")}
                    className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold px-6 py-3.5 rounded-2xl shadow-md shadow-brand-primary/25 transition-all transform hover:-translate-y-0.5 cursor-pointer text-sm"
                  >
                    <Calendar className="w-4 h-4" />
                    จองทันที
                  </button>
                  <button
                    onClick={() => scrollToSection("calendar-view")}
                    className="flex items-center gap-2 bg-white hover:bg-slate-50 text-brand-dark font-bold px-6 py-3.5 rounded-2xl border border-slate-200 shadow-xs transition-all transform hover:-translate-y-0.5 cursor-pointer text-sm"
                  >
                    <BookOpen className="w-4 h-4 text-brand-primary" />
                    ตรวจสอบสถานะว่าง
                  </button>
                </div>
              </div>

              {/* Graphic/Image column */}
              <div className="lg:col-span-5 relative group">
                <div className="absolute -inset-1.5 bg-brand-primary/10 rounded-3xl blur-xl group-hover:bg-brand-primary/20 transition duration-500"></div>
                <div className="relative bg-white p-3 rounded-3xl border border-gray-100 shadow-lg overflow-hidden">
                  <img
                    src={educationHubImg}
                    alt="Education Hub"
                    referrerPolicy="no-referrer"
                    className="w-full h-80 object-cover rounded-2xl group-hover:scale-102 transition duration-500"
                  />
                  <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-white">
                    <h4 className="font-bold text-base font-sans flex items-center gap-1.5">
                      <Sparkles className="w-4.5 h-4.5 text-orange-400" />
                      Education Hub
                    </h4>
                    <p className="text-xs text-slate-100 mt-1">พื้นที่การเรียนรู้ศตวรรษที่ 21 โรงเรียนประสาทวิทยาคาร</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Calendar display */}
            <div id="calendar-view" className="scroll-mt-24">
              <CalendarView
                bookings={bookings}
                rooms={rooms}
                selectedDate={selectedCalendarDate}
                onDateSelect={(date) => {
                  setSelectedCalendarDate(date);
                  // Auto scroll to the booking form below
                  const element = document.getElementById("booking-form-section");
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
              />
            </div>

            {/* Booking form */}
            <div id="booking-form-section" className="scroll-mt-24">
              <BookingForm
                userEmail={userEmail}
                rooms={rooms}
                onLoginClick={() => setIsAuthModalOpen(true)}
                onSubmitBooking={handleSubmitBooking}
                selectedCalendarDate={selectedCalendarDate}
              />
            </div>
          </div>
        )}

        {currentTab === "calendar" && (
          <div className="animate-in fade-in duration-300">
            <CalendarView
              bookings={bookings}
              rooms={rooms}
              selectedDate={selectedCalendarDate}
              onDateSelect={(date) => {
                setSelectedCalendarDate(date);
                setCurrentTab("home");
                setTimeout(() => {
                  const element = document.getElementById("booking-form-section");
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }, 150);
              }}
            />
          </div>
        )}

        {currentTab === "regulations" && (
          <div className="animate-in fade-in duration-300">
            <Regulations />
          </div>
        )}

        {currentTab === "contact" && (
          <div className="animate-in fade-in duration-300">
            <ContactUs />
          </div>
        )}

        {currentTab === "admin" && isAdmin && (
          <div className="animate-in fade-in duration-300 space-y-4">
            <div className="p-4 bg-blue-50 text-brand-dark border border-blue-200/50 rounded-2xl flex items-center justify-between text-sm flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-primary animate-ping" />
                <span>สวัสดีคุณ <strong>{userEmail}</strong> ({isSuperAdmin ? "Super Admin" : "แอดมินรอง"}) - คุณได้รับสิทธิ์ควบคุมดูแลระบบจอง HUB ของโรงเรียน</span>
              </div>
              <span className="text-xs text-brand-primary font-bold bg-white px-2.5 py-1 rounded-lg shadow-2xs border border-blue-100/50">
                {isSuperAdmin ? "สิทธิ์ระดับสูงสุด 👑" : "สิทธิ์แอดมินรอง 🛡️"}
              </span>
            </div>

            <AdminDashboard
              bookings={bookings}
              rooms={rooms}
              onApprove={handleApproveBooking}
              onReject={handleRejectBooking}
              onDelete={handleDeleteBooking}
              onUpdate={handleUpdateBooking}
              onPurgeAll={handlePurgeAllBookings}
              isSuperAdmin={isSuperAdmin}
              subAdmins={subAdmins}
              onAddSubAdmin={handleAddSubAdmin}
              onRemoveSubAdmin={handleRemoveSubAdmin}
              onAddRoom={handleAddRoom}
              onUpdateRoom={handleUpdateRoom}
              onDeleteRoom={handleDeleteRoom}
            />
          </div>
        )}
      </main>

      {/* Auth / Login popup modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onGoogleLogin={handleGoogleLogin}
      />

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 mt-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="space-y-1">
            <h3 className="text-white font-extrabold text-lg tracking-tight font-sans">
              HUB Prasat Wittayakarn School
            </h3>
            <p className="text-xs text-slate-500">
              ศูนย์กลางการเรียนรู้และนวัตกรรม โรงเรียนประสาทวิทยาคาร
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-400">
            <button onClick={() => setCurrentTab("regulations")} className="hover:text-brand-primary transition cursor-pointer">
              นโยบายความเป็นส่วนตัว
            </button>
            <button onClick={() => setCurrentTab("contact")} className="hover:text-brand-primary transition cursor-pointer">
              แผนที่โรงเรียน
            </button>
            <button onClick={() => setCurrentTab("contact")} className="hover:text-brand-primary transition cursor-pointer">
              แจ้งปัญหาการใช้งาน
            </button>
          </div>

          <div className="pt-6 border-t border-slate-800 text-xs text-slate-500">
            © {new Date().getFullYear()} โรงเรียนประสาทวิทยาคาร. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

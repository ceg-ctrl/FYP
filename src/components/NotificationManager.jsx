import React, { useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import emailjs from '@emailjs/browser';

const NotificationManager = ({ user }) => {

  useEffect(() => {
    const checkAndNotify = async () => {
      if (!user) return;

      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      // 1. Check for FDs that mature TODAY (or earlier) and are still 'active'
      const q = query(
        collection(db, "fds"),
        where("userId", "==", user.uid),
        where("status", "==", "active"),
        where("maturityDate", "<=", today) 
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return;
      }

      // 2. Loop through found FDs
      snapshot.forEach(async (document) => {
        const fd = document.data();
        
        // Prepare email params
        const templateParams = {
          to_name: user.displayName || "User",
          to_email: user.email,
          bank_name: fd.bankName,
          principal: fd.principal,
          maturity_date: fd.maturityDate
        };

        try {
          // 3. Send Email via EmailJS (Replace these strings if you set up EmailJS)
          // If you haven't set up EmailJS yet, this will just log an error, which is fine.
          await emailjs.send(
            "YOUR_SERVICE_ID",   
            "YOUR_TEMPLATE_ID",  
            templateParams,
            "YOUR_PUBLIC_KEY"    
          );

          console.log(`Email sent for FD at ${fd.bankName}`);

          // 4. Update Status in Firebase
          await updateDoc(doc(db, "fds", document.id), {
            status: "matured" 
          });

          alert(`💰 Notification: Your FD at ${fd.bankName} has matured today!`);

        } catch (error) {
          // If EmailJS isn't set up, we just alert the user locally
          console.warn("EmailJS not configured or failed:", error);
          
          // Still update status so we don't spam alerts
          await updateDoc(doc(db, "fds", document.id), {
            status: "matured" 
          });
          
          alert(`💰 Notification: Your FD at ${fd.bankName} has matured today!`);
        }
      });
    };

    checkAndNotify();
  }, [user]); 

  return null; // Invisible component
};

export default NotificationManager;
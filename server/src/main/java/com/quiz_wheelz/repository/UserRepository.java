package com.quiz_wheelz.repository;

import com.quiz_wheelz.entitys.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    // בתוך הסוגריים המשולשים כתבנו: <User, Long>
    // User = סוג הישות (המחלקה שיצרנו קודם)
    // Long = סוג הנתונים של המפתח הראשי (@Id) שלנו

    /* * זהו! ברגע שיצרת את זה, קיבלת בחינם עשרות פונקציות מוכנות:
     * save(user) - שמירת משתמש חדש או עדכון קיים
     * findAll() - שליפת כל המשתמשים
     * findById(id) - שליפת משתמש לפי ID
     * deleteById(id) - מחיקת משתמש
     * existsById(id) - בדיקה האם משתמש קיים לפי ID
     */


    // ואם אתה צריך שאילתות מיוחדות? Spring מבין אנגלית!
    // פשוט תכתוב את שם הפונקציה ו-Spring יתרגם אותה ל-SQL:

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);
}
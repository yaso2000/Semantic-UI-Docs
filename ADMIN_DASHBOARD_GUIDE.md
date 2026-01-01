# Admin Dashboard - Complete Documentation

## 🎯 Overview

The Admin Dashboard provides comprehensive management tools for the Holistic Life Coaching platform. As an admin, you can manage users, create coaching packages, and review all client communications for professional oversight.

## 🔐 Admin Access

**Test Admin Credentials:**
- Email: coach@holistic.com
- Password: coach123
- Role: admin

## 📱 Accessing the Admin Dashboard

### From Profile Screen:
1. Login with admin credentials
2. Go to Profile tab (bottom navigation)
3. Tap on the **"Admin Dashboard"** button (highlighted in blue)
4. You'll be redirected to the Admin Dashboard

### Admin Dashboard Home Features:
- **Statistics Overview**: View total users, bookings, and revenue at a glance
- **Quick Access Cards**: Navigate to key management areas
- **Real-time Data**: Stats update automatically

## 👥 User Management

**Path:** Admin Dashboard → User Management

### Features:
- **View All Users**: See complete list of registered client users
- **User Information Display**:
  - Full name
  - Email address
  - Registration date
  - Profile avatar
- **Pull to Refresh**: Swipe down to refresh the user list
- **Quick Actions**: Tap chat icon to view messages (coming soon)

### User Card Information:
```
┌─────────────────────────────────┐
│  👤  John Doe                   │
│     john@example.com            │
│     Joined: Jan 15, 2026        │
│                          💬     │
└─────────────────────────────────┘
```

## 📦 Package Management

**Path:** Admin Dashboard → Manage Packages

### Create New Package:
1. Tap the blue **"+"** button (bottom right)
2. Fill in package details:
   - **Package Name**: e.g., "Starter Package"
   - **Number of Hours**: e.g., 10
   - **Price (USD)**: e.g., 299.99
   - **Description**: Detailed package information
3. View **automatic price per hour calculation**
4. Tap "Create Package" to save

### Package Information Display:
- Package name and description
- Total hours included
- Total price
- Price per hour (auto-calculated)
- Creation date

### Edit Package:
1. Navigate to Manage Packages
2. Tap "Edit" button on any package card
3. Modify the fields
4. Tap "Update Package" to save changes

### Delete Package:
1. Navigate to Manage Packages
2. Tap "Delete" button on package card
3. Confirm deletion in the popup
4. Package will be marked as inactive (soft delete)

### Package Card Layout:
```
┌──────────────────────────────────────┐
│  ⏰  Starter Package               │
│     Perfect for beginners...        │
│                                     │
│  ⏰ 10 hours  💵 $299.99  📊 $30/hr │
│                                     │
│  [Edit]              [Delete]      │
└──────────────────────────────────────┘
```

### Sample Packages (Pre-loaded):
1. **Starter Package**
   - Hours: 10
   - Price: $299.99
   - Price/hour: $30.00

2. **Professional Package**
   - Hours: 25
   - Price: $699.99
   - Price/hour: $28.00

3. **Premium Package**
   - Hours: 50
   - Price: $1299.99
   - Price/hour: $26.00

## 💬 Chat Logs & Professional Review

**Path:** Admin Dashboard → Chat Logs

### Features:
- **All Conversations**: View complete list of client conversations
- **Message Count**: See total messages per conversation
- **Last Message Preview**: Quick view of recent communication
- **Timestamp**: When the last message was sent
- **Professional Review**: Read full conversation history

### Conversations List View:
```
┌──────────────────────────────────────┐
│  👤  John Doe                  [5]   │
│     john@example.com                │
│     💬 "Thanks for the guidance..." │
│     Jan 15, 2026 03:30 PM          │
│                               →     │
└──────────────────────────────────────┘
```

### View Conversation Details:
1. Tap on any conversation card
2. See complete message history
3. Messages are color-coded:
   - **Blue background**: Your messages (Coach)
   - **White with border**: Client messages
4. Each message shows:
   - Sender identification
   - Message content
   - Timestamp
   - Read status (for client messages)

### Conversation Detail View:
```
┌──────────────────────────────────────┐
│  👤 John Doe                        │
│     15 messages                     │
├──────────────────────────────────────┤
│                                     │
│  Client:                            │
│  "Hi, I need help with..."          │
│  Jan 15, 03:25 PM                  │
│                                     │
│               Coach (You):          │
│               "I can help with..."  │
│               Jan 15, 03:30 PM     │
│                                     │
└──────────────────────────────────────┘
```

### Professional Review Guidelines:
- All client communications are stored
- Review for quality assurance
- Monitor coaching effectiveness
- Identify areas needing attention
- Maintain professional standards

## 📊 Dashboard Statistics

### Metrics Displayed:
1. **Total Users**
   - Count of registered client accounts
   - Updated in real-time

2. **Total Bookings**
   - Number of completed session purchases
   - All-time count

3. **Total Revenue**
   - Sum of all completed payments
   - Displayed in USD

### Stats Card Colors:
- **Users**: Blue background (#E3F2FD)
- **Bookings**: Green background (#E8F5E9)
- **Revenue**: Orange background (#FFF3E0)

## 🔄 Navigation Flow

```
Profile Screen (Admin User)
    ↓
[Admin Dashboard Button]
    ↓
Admin Dashboard Home
    ├─→ User Management
    │   └─→ View user details
    ├─→ Manage Packages
    │   ├─→ Create Package
    │   ├─→ Edit Package
    │   └─→ Delete Package
    ├─→ Chat Logs
    │   └─→ Conversation Details
    └─→ Back to Main App
```

## 🎨 UI Features

### Design Elements:
- **Professional Blue Theme**: #2196F3
- **Clear Card-Based Layout**: Easy to scan
- **Touch-Friendly**: 48px minimum touch targets
- **Icon-Driven Interface**: Visual clarity
- **Pull-to-Refresh**: Update data easily
- **Floating Action Button**: Quick package creation
- **Color-Coded Information**: Visual hierarchy

### Responsive Design:
- Works on all screen sizes
- Optimized for phones and tablets
- Thumb-friendly navigation
- Safe area support

## 🔒 Security Features

### Admin Role Verification:
- Automatic role check on dashboard entry
- Non-admin users redirected
- JWT token validation on all requests
- Secure API endpoints

### Access Control:
- Only admin users see the dashboard button
- All admin endpoints require authorization
- Token-based authentication
- Role-based permissions

## 📱 Mobile UX Considerations

### Performance:
- **Loading States**: Activity indicators during data fetch
- **Error Handling**: User-friendly error messages
- **Refresh Control**: Pull-down to update data
- **Optimized Lists**: Efficient rendering for large datasets

### User Feedback:
- **Confirmation Dialogs**: Before destructive actions
- **Success Alerts**: After successful operations
- **Real-time Updates**: Immediate data refresh
- **Visual Indicators**: Loading, success, error states

## 🧪 Testing the Admin Features

### Test Package Creation:
1. Login as admin (coach@holistic.com / coach123)
2. Go to Profile → Admin Dashboard
3. Tap "Manage Packages"
4. Tap the "+" button
5. Create a test package:
   - Name: "Test Package"
   - Hours: 5
   - Price: 149.99
6. Verify it appears in the list

### Test Package Editing:
1. Find "Test Package" in the list
2. Tap "Edit"
3. Change hours to 8
4. Change price to 199.99
5. Save and verify changes

### Test Package Deletion:
1. Find "Test Package"
2. Tap "Delete"
3. Confirm deletion
4. Verify it's removed from the list

### Test User Management:
1. Go to Admin Dashboard → User Management
2. Verify your test users appear
3. Check user information is correct
4. Test pull-to-refresh

### Test Chat Logs:
1. Go to Admin Dashboard → Chat Logs
2. View conversation list
3. Tap on a conversation
4. Verify messages display correctly
5. Check timestamps and read status

## 🔗 API Endpoints Used

### Admin Stats:
- `GET /api/admin/stats`
- Returns: total_users, total_bookings, total_revenue

### User Management:
- `GET /api/admin/users`
- Returns: Array of client users

### Package Management:
- `GET /api/packages` - List all packages
- `POST /api/packages` - Create new package
- `PUT /api/packages/{id}` - Update package
- `DELETE /api/packages/{id}` - Delete package

### Chat Logs:
- `GET /api/messages/{user_id}` - Get conversation
- `GET /api/messages/conversations` - List all conversations

## 💡 Tips & Best Practices

### For Package Management:
- **Price Strategically**: Lower price per hour for larger packages
- **Clear Descriptions**: Help clients understand value
- **Regular Updates**: Keep packages current and competitive
- **Monitor Performance**: Track which packages sell best

### For User Management:
- **Regular Check-ins**: Review user registrations
- **Monitor Activity**: Track user engagement
- **Professional Communication**: Maintain high standards

### For Chat Review:
- **Regular Reviews**: Check conversations weekly
- **Quality Assurance**: Ensure professional standards
- **Privacy Respect**: Review only for professional purposes
- **Response Time**: Monitor coach response times

## 🚀 Future Enhancements

### Coming Soon:
- User activity analytics
- Booking trend reports
- Revenue charts and graphs
- Export data functionality
- Bulk operations
- Advanced filters
- Search functionality
- Booking management UI
- Payment history details
- User statistics per client

## ❓ Troubleshooting

### Can't Access Admin Dashboard:
- Verify you're logged in as admin
- Check your role in the profile
- Logout and login again
- Contact support if issue persists

### Data Not Loading:
- Pull down to refresh
- Check internet connection
- Verify backend is running
- Check browser console for errors

### Package Not Saving:
- Ensure all fields are filled
- Check price and hours are valid numbers
- Verify you have admin permissions
- Check error message for details

## 📞 Support

For admin-related issues or questions:
1. Check this documentation first
2. Review error messages carefully
3. Test with sample data
4. Contact technical support if needed

---

**Admin Dashboard Version:** 1.0
**Last Updated:** January 2026
**Platform:** Holistic Life Coaching Mobile App

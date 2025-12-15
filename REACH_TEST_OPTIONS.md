# Reach/Meetings Test Options

## Current Tests (6)
✅ Create meeting  
✅ Schedule meeting  
✅ Start meeting  
✅ Delete meeting  
✅ Invite participant  
✅ Join meeting with ID and passcode  

## Additional Test Options

### High Priority (Core Functionality)

#### 1. **Edit/Update Meeting** @critical
- Find an existing meeting
- Click edit icon/button
- Update meeting details (title, date, time, etc.)
- Save changes
- Verify meeting was updated

#### 2. **View Meeting Details** @functional
- Click on a meeting to view details
- Verify meeting information is displayed (ID, date, time, participants, etc.)
- Check if meeting link/ID is visible and copyable

#### 3. **End Meeting** (while in meeting) @critical
- Start a meeting
- Click "End Meeting" button
- Confirm end meeting
- Verify redirected back to meetings list

#### 4. **Leave Meeting** @functional
- Join a meeting
- Click "Leave Meeting" button
- Verify left the meeting and returned to meetings list

#### 5. **Copy Meeting Link/ID** @functional
- Find a meeting
- Click copy link/ID button
- Verify link/ID is copied to clipboard
- Verify notification/confirmation appears

### Medium Priority (Meeting Controls)

#### 6. **Mute/Unmute Audio** @functional
- Start/join a meeting
- Click mute button
- Verify audio is muted (icon changes)
- Click unmute
- Verify audio is unmuted

#### 7. **Turn Video On/Off** @functional
- Start/join a meeting
- Click video toggle button
- Verify video turns off (icon changes)
- Click again to turn on
- Verify video turns on

#### 8. **Share Screen** @functional
- Start/join a meeting
- Click share screen button
- Select screen/window to share
- Verify screen sharing starts
- Stop screen sharing

#### 9. **Chat in Meeting** @functional
- Start/join a meeting
- Open chat panel
- Send a message
- Verify message appears in chat
- Verify other participants can see message

### Lower Priority (Advanced Features)

#### 10. **Record Meeting** @functional
- Start a meeting
- Click record button
- Verify recording starts (indicator appears)
- Stop recording
- Verify recording is saved/available

#### 11. **View Participants List** @functional
- Start/join a meeting
- Open participants panel
- Verify list of participants is displayed
- Verify participant count is correct

#### 12. **Meeting Settings/Preferences** @functional
- Open meeting settings
- Update preferences (audio, video defaults, etc.)
- Save settings
- Verify settings are applied

#### 13. **Cancel Scheduled Meeting** @functional
- Find a scheduled meeting
- Click cancel button
- Confirm cancellation
- Verify meeting is cancelled (status changes)

#### 14. **Recurring Meeting** @functional
- Create/schedule a meeting
- Enable recurring option
- Set recurrence pattern (daily, weekly, etc.)
- Save meeting
- Verify recurring meetings are created

#### 15. **Meeting Reminders** @functional
- Schedule a meeting
- Set reminder (15 min before, etc.)
- Verify reminder is set
- Check if reminder notification appears (if testable)

## Recommended Next Steps

### Phase 1 (Critical Path)
1. Edit/Update Meeting
2. End Meeting
3. Copy Meeting Link/ID

### Phase 2 (User Experience)
4. View Meeting Details
5. Leave Meeting
6. Mute/Unmute Audio

### Phase 3 (Advanced Features)
7. Turn Video On/Off
8. Share Screen
9. Chat in Meeting

## Test Implementation Notes

- All tests should follow the same pattern as existing tests
- Use robust element finding with multiple selector strategies
- Include proper error handling and fallbacks
- Add detailed console logging for debugging
- Mark critical tests with @critical tag
- Use @functional tag for non-critical features


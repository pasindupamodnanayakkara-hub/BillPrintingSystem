!macro customInstall
  DetailPrint "Adding Windows Firewall Rule for Bill Studio..."
  nsExec::ExecToLog 'netsh advfirewall firewall add rule name="Bill Studio" dir=in action=allow program="$INSTDIR\Bill Studio.exe" enable=yes'
!macroend

!macro customUnInstall
  DetailPrint "Removing Windows Firewall Rule for Bill Studio..."
  nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="Bill Studio" program="$INSTDIR\Bill Studio.exe"'

  ; Better UI for data deletion
  MessageBox MB_YESNO "CLEANUP DATA?$\n$\nDo you want to PERMANENTLY DELETE all local invoice history, business profiles, and settings? (Recommended if you are not planning to reinstall soon)." IDNO skip_cleanup
    DetailPrint "Full data cleanup initiated by user..."
    SetShellVarContext current
    
    ; Aggressively kill any lingering processes to release file locks
    nsExec::Exec 'taskkill /F /IM "Bill Studio.exe" /T'
    Sleep 2000
    
    RMDir /r "$APPDATA\billprintingsystem"
    RMDir /r "$LOCALAPPDATA\billprintingsystem"
    RMDir /r "$LOCALAPPDATA\billprintingsystem-updater"
    
    ; Cleanup custom installer metadata keys
    DeleteRegKey HKLM "Software\6b7d4f78-95ed-4c05-8472-5242e176132d"
    DeleteRegKey HKCU "Software\6b7d4f78-95ed-4c05-8472-5242e176132d"
  skip_cleanup:
!macroend

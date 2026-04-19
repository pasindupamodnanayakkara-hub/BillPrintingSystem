!macro customInstall
  DetailPrint "Adding Windows Firewall Rule for Bill Studio..."
  nsExec::ExecToLog 'netsh advfirewall firewall add rule name="Bill Studio" dir=in action=allow program="$INSTDIR\Bill Studio.exe" enable=yes'
!macroend

!macro customUnInstall
  DetailPrint "Removing Windows Firewall Rule for Bill Studio..."
  nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="Bill Studio" program="$INSTDIR\Bill Studio.exe"'
!macroend

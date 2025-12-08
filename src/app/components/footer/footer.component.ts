import { Component } from '@angular/core';
import { RouterModule } from '@angular/router'; // Importar esto para que funcionen los links

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule], // Agregar al imports
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {

}